import { select, type Selection } from 'd3-selection';
import { DISC_D, DOT_D, END_OVERRUN, laneAt, roundedPath, toXY } from './geometry';
import type { LineLayout, MapData, MapLine, MapStation, MapTrack, Orientation, Scale } from './types';

export const INK = '#0A0A0A';
const MUTED = '#555555';
const WHITE = '#FFFFFF';
const FONT = "'JetBrains Mono', ui-monospace, monospace";
const LABEL_PX = 12;
const CHAR_W = 0.6 * LABEL_PX;
const LINE_H = 15;
const LABEL_GAP = 0.75;
const MIN_LW = 8;
const MAX_LW = 16;
const H_SWITCH_LW = 9;
const PAD = 24;
const AXIS_ROW = 30;
const AXIS_COL = 44;

export interface StationModel {
  st: MapStation;
  slot: number;
  labelSide: 'before' | 'after';
  dots: { track: MapTrack; lane: number }[];
  minLane: number;
  maxLane: number;
  kind: 'station' | 'interchange' | 'terminal';
  themes: string[];
}
export interface Model { line: MapLine; tracks: MapTrack[]; stations: StationModel[] }
export interface RenderResult { scale: Scale; model: Model }

export function yearsOf(st: MapStation): string {
  if (st.end === null) return `${st.start}–now`;
  if (st.end === st.start) return `${st.start}`;
  const same = Math.floor(st.start / 100) === Math.floor(st.end / 100);
  return `${st.start}–${same ? String(st.end).slice(2) : st.end}`;
}

export function buildModel(data: MapData, layout: LineLayout): Model {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) throw new Error(`Unknown line ${layout.lineId}`);
  const themeIds = new Set(data.themes.filter((t) => t.line === line.id).map((t) => t.id));
  const tracks = data.tracks.filter((t) => themeIds.has(t.theme) && layout.tracks[t.id]);
  const stations: StationModel[] = [];
  for (const st of data.stations) {
    const sl = layout.stations[st.id];
    if (!sl || !st.lines.includes(line.id)) continue;
    const dots: StationModel['dots'] = [];
    for (const track of tracks) {
      if (!track.stations.includes(st.id)) continue;
      const lane = laneAt(layout.tracks[track.id]!.route, sl.slot);
      if (lane !== null) dots.push({ track, lane });
    }
    if (!dots.length) continue;
    dots.sort((a, b) => a.lane - b.lane);
    const endsHere = dots.some((d) => !d.track.ongoing && d.track.stations[d.track.stations.length - 1] === st.id);
    const themes: string[] = [];
    for (const d of dots) {
      const th = data.themes.find((t) => t.id === d.track.theme);
      if (th && !themes.includes(th.short)) themes.push(th.short);
    }
    stations.push({
      st, slot: sl.slot, labelSide: sl.labelSide, dots, themes,
      minLane: dots[0]!.lane, maxLane: dots[dots.length - 1]!.lane,
      kind: dots.length >= 2 ? 'interchange' : endsHere ? 'terminal' : 'station',
    });
  }
  stations.sort((a, b) => a.slot - b.slot);
  return { line, tracks, stations };
}

/** Choose orientation and lw for a container width. Fits content by iterating on measured extent. */
export function chooseScale(width: number, model: Model, layout: LineLayout): { scale: Scale; box: Box } {
  const tryFit = (o: Orientation): { lw: number; scale: Scale; box: Box } => {
    const slotGap = layout.slotGap[o];
    let lw = o === 'horizontal' ? (width - 2 * PAD) / (9 * slotGap + 4) : 12;
    let out = measure(o, lw, width, model, layout);
    const avail = width - (o === 'horizontal' ? 2 * PAD : PAD + AXIS_COL);
    for (let i = 0; i < 6; i++) {
      const used = out.box.x1 - out.box.x0;
      if (Math.abs(used - avail) < 1 && lw <= MAX_LW) break;
      lw = Math.max(1, lw * (avail / used) * (used > avail ? 0.995 : 1));
      if (lw > MAX_LW) { lw = MAX_LW; out = measure(o, lw, width, model, layout); break; }
      out = measure(o, lw, width, model, layout);
    }
    return { lw, ...out };
  };
  const h = tryFit('horizontal');
  const pick = h.lw < H_SWITCH_LW ? tryFit('vertical') : h;
  const lw = Math.min(MAX_LW, Math.max(MIN_LW, pick.lw));
  const o = pick.scale.orientation;
  const m = measure(o, lw, width, model, layout);
  const b = m.box;
  const used = b.x1 - b.x0;
  const originX = o === 'horizontal'
    ? Math.max(PAD, (width - used) / 2) - b.x0
    : AXIS_COL - b.x0;
  const originY = o === 'horizontal' ? AXIS_ROW - b.y0 : PAD / 2 - b.y0;
  return { scale: { ...m.scale, originX, originY }, box: b };
}

interface Box { x0: number; y0: number; x1: number; y1: number }

function measure(o: Orientation, lw: number, width: number, model: Model, layout: LineLayout): { scale: Scale; box: Box } {
  const scale: Scale = { orientation: o, lw, slotGap: layout.slotGap[o], originX: 0, originY: 0 };
  const p = plan(model, layout, scale, width, 0);
  return { scale, box: p.box };
}

interface Plan {
  box: Box;
  tracks: { id: string; d: string; hatched: boolean; colour: string }[];
  stations: {
    id: string; aria: string; major: boolean;
    connectors: { key: string; x1: number; y1: number; x2: number; y2: number }[];
    dots: { key: string; cx: number; cy: number; label: string }[];
    label: { lines: string[]; x: number; y: number; anchor: string };
  }[];
  discs: { key: string; cx: number; cy: number; label: string; text: string }[];
  axis: { key: string; x: number; y: number; anchor: string; text: string }[];
  today: { x: number; y: number } | null;
}

function wrap(text: string, budget: number): string[] {
  if (text.length * CHAR_W <= budget) return [text];
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const m = Math.max(a.length, b.length) * CHAR_W;
    if (m < bestW) { bestW = m; best = [a, b]; }
  }
  return best;
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
export const textOn = (colour: string): string => (luminance(colour) > 0.3 ? INK : WHITE);

function plan(model: Model, layout: LineLayout, s: Scale, W: number, H: number): Plan {
  const { lw } = s;
  const horiz = s.orientation === 'horizontal';
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    box.x0 = Math.min(box.x0, x0); box.y0 = Math.min(box.y0, y0);
    box.x1 = Math.max(box.x1, x1); box.y1 = Math.max(box.y1, y1);
  };
  const over = END_OVERRUN * lw;
  const colour = model.line.colour;
  let today: Plan['today'] = null;

  const tracks: Plan['tracks'] = model.tracks.map((t) => {
    const pts = layout.tracks[t.id]!.route.map((p) => toXY(p.slot, p.lane, s));
    const first = pts[0]!;
    const last = pts[pts.length - 1]!;
    const dir = (a: [number, number], b: [number, number]): [number, number] => {
      const dx = b[0] - a[0]; const dy = b[1] - a[1]; const l = Math.hypot(dx, dy);
      return l > 0 ? [dx / l, dy / l] : horiz ? [1, 0] : [0, 1];
    };
    const f = dir(first, pts[1] ?? [first[0] + (horiz ? 1 : 0), first[1] + (horiz ? 0 : 1)]);
    const l = dir(pts[pts.length - 2] ?? first, last);
    const start: [number, number] = [first[0] - f[0] * over, first[1] - f[1] * over];
    let end: [number, number] = [last[0] + l[0] * over, last[1] + l[1] * over];
    grow(Math.min(start[0], end[0]) - lw / 2, Math.min(start[1], end[1]) - lw / 2, Math.max(start[0], end[0]) + lw / 2, Math.max(start[1], end[1]) + lw / 2);
    if (t.ongoing) {
      const k = horiz ? l[0] : l[1];
      const t2 = k > 0.001 ? ((horiz ? W - last[0] : H - last[1]) / k) : 0;
      end = [last[0] + l[0] * Math.max(0, t2), last[1] + l[1] * Math.max(0, t2)];
      today = horiz ? { x: W - 6, y: end[1] - LABEL_GAP * lw } : { x: end[0] - LABEL_GAP * lw, y: H - 6 };
    }
    const mid = pts.slice(1, -1);
    return { id: t.id, d: roundedPath([start, ...mid, end], 1.5 * lw), hatched: t.hatched, colour };
  });

  const budget = horiz ? s.slotGap * lw * 0.92 : Math.min(150, Math.max(72, W * 0.28));
  const stations: Plan['stations'] = model.stations.map((sm) => {
    const [sx, sy] = toXY(sm.slot, 0, s);
    const lanes = [sm.minLane, sm.maxLane];
    grow(...(horiz ? [sx - lw / 2, toXY(0, lanes[0]!, s)[1] - lw / 2, sx + lw / 2, toXY(0, lanes[1]!, s)[1] + lw / 2] as const
      : [toXY(sm.slot, lanes[0]!, s)[0] - lw / 2, sy - lw / 2, toXY(sm.slot, lanes[1]!, s)[0] + lw / 2, sy + lw / 2] as const));
    const connectors: Plan['stations'][number]['connectors'] = [];
    const dots = sm.dots.map((d) => {
      const [cx, cy] = toXY(sm.slot, d.lane, s);
      return { key: d.track.id, cx, cy, label: d.track.label };
    });
    for (let i = 1; i < sm.dots.length; i++) {
      const a = sm.dots[i - 1]!; const b = sm.dots[i]!;
      if (b.lane - a.lane > DOT_D * 1.01 + 0.12) {
        const [x1, y1] = toXY(sm.slot, a.lane, s); const [x2, y2] = toXY(sm.slot, b.lane, s);
        connectors.push({ key: `${a.track.id}|${b.track.id}`, x1, y1, x2, y2 });
      }
    }
    // Label placement
    const before = sm.labelSide === 'before';
    let edge = before ? sm.minLane - DOT_D / 2 : sm.maxLane + DOT_D / 2;
    for (const d of layout.discs) {
      if (d.slot !== sm.slot) continue;
      if (before && d.lane < sm.minLane) edge = Math.min(edge, d.lane - DISC_D / 2);
      if (!before && d.lane > sm.maxLane) edge = Math.max(edge, d.lane + DISC_D / 2);
    }
    const lines = wrap(sm.st.name, budget);
    const n = lines.length;
    const wpx = Math.max(...lines.map((x) => x.length * CHAR_W));
    const [ex, ey] = toXY(sm.slot, edge, s);
    const gap = LABEL_GAP * lw;
    let lx: number; let ly: number; let anchor: string;
    if (horiz) {
      lx = ex; anchor = 'middle';
      ly = before ? ey - gap - (n - 1) * LINE_H - 3 : ey + gap + 10;
      grow(lx - wpx / 2, ly - 10, lx + wpx / 2, ly + (n - 1) * LINE_H + 3);
    } else {
      ly = ey - ((n - 1) * LINE_H) / 2 + 4;
      lx = before ? ex - gap : ex + gap;
      anchor = before ? 'end' : 'start';
      grow(before ? lx - wpx : lx, ly - 10, before ? lx : lx + wpx, ly + (n - 1) * LINE_H + 3);
    }
    return {
      id: sm.st.id, aria: `${sm.st.name}, ${yearsOf(sm.st)}`, major: sm.kind !== 'station',
      connectors, dots, label: { lines, x: lx, y: ly, anchor },
    };
  });

  const discs: Plan['discs'] = [];
  for (const d of layout.discs) {
    const t = model.tracks.find((x) => x.id === d.trackId);
    if (!t) continue;
    const [cx, cy] = toXY(d.slot + d.dt / s.slotGap, d.lane, s);
    grow(cx - lw, cy - lw, cx + lw, cy + lw);
    discs.push({ key: t.id, cx, cy, label: t.label, text: textOn(colour) });
  }

  const axis: Plan['axis'] = model.stations.map((sm) => {
    const [ax, ay] = toXY(sm.slot, 0, s);
    return horiz
      ? { key: sm.st.id, x: ax, y: 16, anchor: 'middle', text: String(sm.st.start) }
      : { key: sm.st.id, x: 4, y: ay + 4, anchor: 'start', text: String(sm.st.start) };
  });
  return { box, tracks, stations, discs, axis, today };
}

type Sel<E extends Element> = Selection<E, unknown, any, unknown>;
const layer = (svg: Sel<SVGSVGElement>, name: string): Sel<SVGGElement> =>
  svg.selectAll<SVGGElement, null>(`g.tm-layer-${name}`).data([null]).join('g').attr('class', `tm-layer-${name}`) as Sel<SVGGElement>;

/** Write one hatch pattern per colour into a <defs>. Rule 35: stripes 0.25 lw wide, period 0.5 lw, 45 degrees. */
export function hatchPatterns(defs: Sel<SVGDefsElement>, colours: string[], lw: number): void {
  const pats = defs.selectAll<SVGPatternElement, string>('pattern').data(colours, (c) => c).join('pattern');
  pats.attr('id', (c) => hatchId(c)).attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 0.5 * lw).attr('height', 0.5 * lw).attr('patternTransform', 'rotate(45)');
  pats.each(function (c) {
    const rects = select(this).selectAll<SVGRectElement, { x: number; fill: string }>('rect')
      .data([{ x: 0, fill: c }, { x: 0.25 * lw, fill: WHITE }]).join('rect');
    rects.attr('x', (d) => d.x).attr('y', 0).attr('width', 0.25 * lw).attr('height', 0.5 * lw).attr('fill', (d) => d.fill);
  });
}
export const hatchId = (c: string): string => `tm-hatch-${c.replace('#', '')}`;

export function renderMap(container: HTMLElement, data: MapData, layout: LineLayout): RenderResult {
  const W = Math.max(1, Math.round(container.clientWidth || container.getBoundingClientRect().width));
  const model = buildModel(data, layout);
  const { scale } = chooseScale(W, model, layout);
  const bbox = plan(model, layout, scale, W, 0).box;
  const H = Math.ceil(bbox.y1 + (scale.orientation === 'horizontal' ? 20 : PAD));
  const p = plan(model, layout, scale, W, H);
  const lw = scale.lw;

  const root = select(container);
  const svg = root.selectAll<SVGSVGElement, null>('svg.tm-svg').data([null]).join('svg')
    .attr('class', 'tm-svg').attr('width', W).attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'group')
    .attr('aria-label', `${model.line.name} line`) as Sel<SVGSVGElement>;

  const defs = svg.selectAll<SVGDefsElement, null>('defs').data([null]).join('defs') as Sel<SVGDefsElement>;
  hatchPatterns(defs, [model.line.colour], lw);

  layer(svg, 'tracks').selectAll<SVGPathElement, Plan['tracks'][number]>('path.tm-track').data(p.tracks, (d) => d.id).join('path')
    .attr('class', 'tm-track').attr('d', (d) => d.d).attr('fill', 'none')
    .attr('stroke', (d) => (d.hatched ? `url(#${hatchId(d.colour)})` : d.colour))
    .attr('stroke-width', lw).attr('stroke-linecap', 'butt').attr('stroke-linejoin', 'round');

  const discs = layer(svg, 'discs').selectAll<SVGGElement, Plan['discs'][number]>('g.tm-disc-group').data(p.discs, (d) => d.key).join('g').attr('class', 'tm-disc-group');
  discs.selectAll<SVGCircleElement, Plan['discs'][number]>('circle.tm-disc').data((d) => [d]).join('circle')
    .attr('class', 'tm-disc').attr('cx', (d) => d.cx).attr('cy', (d) => d.cy).attr('r', (DISC_D * lw) / 2).attr('fill', model.line.colour);
  discs.selectAll<SVGTextElement, Plan['discs'][number]>('text.tm-disc-id').data((d) => [d]).join('text')
    .attr('class', 'tm-disc-id').attr('x', (d) => d.cx).attr('y', (d) => d.cy)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
    .attr('font-family', FONT).attr('font-weight', 700).attr('font-size', 0.7 * lw)
    .attr('fill', (d) => d.text).text((d) => d.label);

  const selected = container.dataset.selected ?? '';
  const choose = (id: string): void => {
    container.dataset.selected = id;
    svg.selectAll<SVGGElement, Plan['stations'][number]>('g.tm-station').classed('is-selected', (d) => d.id === id);
    container.dispatchEvent(new CustomEvent('tm:select', { detail: id }));
  };
  const sts = layer(svg, 'stations').selectAll<SVGGElement, Plan['stations'][number]>('g.tm-station').data(p.stations, (d) => d.id).join('g')
    .attr('class', 'tm-station').attr('tabindex', 0).attr('role', 'button')
    .attr('aria-label', (d) => d.aria).attr('data-station', (d) => d.id)
    .classed('is-selected', (d) => d.id === selected)
    .style('cursor', 'pointer')
    .on('click', (_e, d) => choose(d.id))
    .on('keydown', (e: KeyboardEvent, d) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); choose(d.id); }
    });
  sts.selectAll<SVGLineElement, Plan['stations'][number]['connectors'][number]>('line.tm-connector').data((d) => d.connectors, (c) => c.key).join('line')
    .attr('class', 'tm-connector').attr('x1', (c) => c.x1).attr('y1', (c) => c.y1).attr('x2', (c) => c.x2).attr('y2', (c) => c.y2)
    .attr('stroke', INK).attr('stroke-width', 0.14 * lw);
  sts.selectAll<SVGCircleElement, Plan['stations'][number]['dots'][number]>('circle.tm-dot').data((d) => d.dots, (c) => c.key).join('circle')
    .attr('class', 'tm-dot').attr('cx', (c) => c.cx).attr('cy', (c) => c.cy).attr('r', (DOT_D * lw) / 2).attr('fill', INK);
  sts.selectAll<SVGTextElement, Plan['stations'][number]['dots'][number]>('text.tm-dot-id').data((d) => d.dots, (c) => c.key).join('text')
    .attr('class', 'tm-dot-id').attr('x', (c) => c.cx).attr('y', (c) => c.cy)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('pointer-events', 'none')
    .attr('font-family', FONT).attr('font-weight', 700).attr('font-size', 0.55 * lw).attr('fill', WHITE).text((c) => c.label);
  const labels = sts.selectAll<SVGTextElement, Plan['stations'][number]>('text.tm-label').data((d) => [d]).join('text')
    .attr('class', (d) => (d.major ? 'tm-label is-major' : 'tm-label'))
    .attr('text-anchor', (d) => d.label.anchor).attr('font-family', FONT).attr('font-size', LABEL_PX)
    .attr('font-weight', (d) => (d.major ? 700 : 400)).attr('fill', (d) => (d.major ? INK : MUTED));
  labels.selectAll<SVGTSpanElement, { x: number; y: number; text: string }>('tspan')
    .data((d) => d.label.lines.map((text, i) => ({ x: d.label.x, y: d.label.y + i * LINE_H, text }))).join('tspan')
    .attr('x', (t) => t.x).attr('y', (t) => t.y).text((t) => t.text);

  layer(svg, 'axis').selectAll<SVGTextElement, Plan['axis'][number]>('text.tm-axis').data(p.axis, (d) => d.key).join('text')
    .attr('class', 'tm-axis').attr('x', (d) => d.x).attr('y', (d) => d.y).attr('text-anchor', (d) => d.anchor)
    .attr('font-family', FONT).attr('font-size', LABEL_PX).attr('fill', MUTED).text((d) => d.text);

  layer(svg, 'today').selectAll<SVGTextElement, NonNullable<Plan['today']>>('text.tm-today').data(p.today ? [p.today] : []).join('text')
    .attr('class', 'tm-today').attr('x', (d) => d.x).attr('y', (d) => d.y).attr('text-anchor', 'end')
    .attr('font-family', FONT).attr('font-size', LABEL_PX).attr('font-weight', 700).attr('fill', INK).text('TODAY');

  return { scale, model };
}
