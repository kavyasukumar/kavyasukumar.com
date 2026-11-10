import { select, type Selection } from 'd3-selection';
import { hoverIn, hoverOut, registerMap, tapTrack } from './highlight';
import { casings, type Casing } from './crossings';
import { DISC_D, DOT_D, END_OVERRUN, laneAt, roundedPath, toXY } from './geometry';
import { CHAR_W, LABEL_PX, LINE_H, placeLabel, wrap, type ScreenDir } from './labels';
import type { LineLayout, MapData, MapLine, MapStation, MapTrack, Orientation, Scale, StationLayout } from './types';

export const INK = '#0A0A0A';
const MUTED = '#555555';
const WHITE = '#FFFFFF';
const CREAM = '#F4E9D5'; // map background, used for crossing casings (rule 19)
const FONT = "'JetBrains Mono', ui-monospace, monospace";
const LABEL_GAP = 0.75;
// Dots must hold a 12px track ID (rule 22), so a track is at least 16px wide.
const MIN_LW = 16;
const MAX_LW = 22;
const H_SWITCH_LW = 15;
const PAD = 24;
// No time axis (rule 39): only order matters.
const AXIS_ROW = 12;
const AXIS_COL = PAD;

export interface StationModel {
  st: MapStation;
  slot: number;
  labelSide: StationLayout['labelSide'];
  dots: { track: MapTrack; lane: number; slot: number }[];
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
      const tl = layout.tracks[track.id]!;
      const at = tl.stops?.[st.id];
      if (at) { dots.push({ track, lane: at.lane, slot: at.slot }); continue; }
      const lane = laneAt(tl.route, sl.slot);
      if (lane !== null) dots.push({ track, lane, slot: sl.slot });
    }
    if (!dots.length) continue;
    dots.sort((a, b) => a.lane - b.lane || a.slot - b.slot);
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
  tracks: { id: string; theme: string; d: string; colour: string; top: boolean }[];
  casings: Casing[];
  stations: {
    id: string; aria: string; major: boolean; themes: string;
    connectors: { key: string; theme: string; x1: number; y1: number; x2: number; y2: number }[];
    dots: { key: string; theme: string; cx: number; cy: number; label: string }[];
    label: { lines: string[]; x: number; y: number; anchor: string };
  }[];
  discs: { key: string; cx: number; cy: number; label: string; text: string }[];
  axis: { key: string; x: number; y: number; anchor: string; text: string }[];
  today: { x: number; y: number } | null;
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
    for (const q of [start, ...pts, end]) grow(q[0] - lw / 2, q[1] - lw / 2, q[0] + lw / 2, q[1] + lw / 2);
    if (t.ongoing) {
      const k = horiz ? l[0] : l[1];
      // While measuring (H === 0) reserve a short run; the final pass runs to the canvas edge.
      const t2 = H === 0 ? 3 * lw : k > 0.001 ? ((horiz ? W - last[0] : H - last[1]) / k) : 0;
      end = [last[0] + l[0] * Math.max(0, t2), last[1] + l[1] * Math.max(0, t2)];
      // TODAY sits just outside the outermost ongoing track, never on a track (rule 29).
      const t3 = horiz ? { x: end[0] - 6, y: end[1] + lw / 2 + LABEL_GAP * lw + 10 } : { x: end[0] + lw / 2 + LABEL_GAP * lw, y: end[1] - 6 };
      if (!today || (horiz ? t3.y > today.y : t3.x > today.x)) today = t3;
    }
    const mid = pts.slice(1, -1);
    const tl = layout.tracks[t.id]!;
    return { id: t.id, theme: t.theme, d: roundedPath([start, ...mid, end], (tl.radii ?? [1.5]).map((r) => r * lw)), colour, top: !!tl.top };
  });

  const budget = horiz ? s.slotGap * lw * 0.92 : Math.min(150, Math.max(72, W * 0.28));
  const stations: Plan['stations'] = model.stations.map((sm) => {
    const dots = sm.dots.map((d) => {
      const [cx, cy] = toXY(d.slot, d.lane, s);
      grow(cx - lw / 2, cy - lw / 2, cx + lw / 2, cy + lw / 2);
      return { key: d.track.id, theme: d.track.theme, cx, cy, label: d.track.label };
    });
    // Dots that do not touch are joined by a connector (rule 24).
    const connectors: Plan['stations'][number]['connectors'] = [];
    for (let i = 1; i < dots.length; i++) {
      const a = dots[i - 1]!; const b = dots[i]!;
      if (Math.hypot(b.cx - a.cx, b.cy - a.cy) > (DOT_D * 1.01 + 0.12) * lw) {
        connectors.push({ key: `${a.key}|${b.key}`, theme: a.theme === b.theme ? a.theme : '', x1: a.cx, y1: a.cy, x2: b.cx, y2: b.cy });
      }
    }
    const lines = wrap(sm.st.name, budget);
    const n = lines.length;
    const wpx = Math.max(...lines.map((x) => x.length * CHAR_W));
    const side = sm.labelSide;
    let ex: number; let ey: number; let dir: ScreenDir;
    if (side === 'tip' || side === 'back') {
      const mean = (f: (d: StationModel['dots'][number]) => number): number => sm.dots.reduce((a, d) => a + f(d), 0) / sm.dots.length;
      if (side === 'tip') {
        // J-curve tip: past the dot and the square end, in the leg's direction (rule 20).
        const tip = sm.maxLane + DOT_D / 2 + END_OVERRUN;
        const mid = mean((d) => d.slot);
        // Vertical layout: if a track runs where the label would go (east of the tip), the
        // label sits under the dots instead, so it never crosses a track (rules 20, 29).
        const need = (wpx + 2 * LABEL_GAP * lw) / lw;
        const blocked = !horiz && Object.values(layout.tracks).some((tl) => {
          const ln = laneAt(tl.route, mid);
          return ln !== null && ln + DOT_D / 2 > tip && ln - DOT_D / 2 < tip + need;
        });
        if (blocked) {
          const last = Math.max(...sm.dots.map((d) => d.slot));
          [ex, ey] = toXY(last + DOT_D / 2 / s.slotGap, mean((d) => d.lane), s);
          dir = 'down';
        } else {
          [ex, ey] = toXY(mid, tip, s);
          dir = horiz ? 'down' : 'right';
        }
      } else {
        const first = Math.min(...sm.dots.map((d) => d.slot));
        [ex, ey] = toXY(first - DOT_D / 2 / s.slotGap, mean((d) => d.lane), s);
        dir = horiz ? 'left' : 'up';
      }
    } else {
      // Start just past this station's dots, then step past any track or disc in the
      // way. The label may sit in a gap between bands when it fits there (rules 29, 30).
      const before = side === 'before';
      const needPx = horiz ? n * LINE_H + 2 * LABEL_GAP * lw : wpx + 2 * LABEL_GAP * lw;
      const need = needPx / lw;
      const obstacles: [number, number][] = [];
      for (const tl of Object.values(layout.tracks)) {
        const ln = laneAt(tl.route, sm.slot);
        if (ln !== null) obstacles.push([ln - DOT_D / 2, ln + DOT_D / 2]);
      }
      for (const d of layout.discs) {
        if (d.slot === sm.slot) obstacles.push([d.lane - DISC_D / 2, d.lane + DISC_D / 2]);
      }
      let edge = before ? sm.minLane - DOT_D / 2 : sm.maxLane + DOT_D / 2;
      for (let moved = true; moved;) {
        moved = false;
        for (const [lo, hi] of obstacles) {
          const blocks = before ? lo < edge && hi > edge - need : hi > edge && lo < edge + need;
          if (!blocks) continue;
          const next = before ? Math.min(edge, lo) : Math.max(edge, hi);
          if (next !== edge) { edge = next; moved = true; }
        }
      }
      [ex, ey] = toXY(sm.slot, edge, s);
      dir = horiz ? (before ? 'up' : 'down') : (before ? 'left' : 'right');
    }
    const placed = placeLabel(dir, ex, ey, LABEL_GAP * lw, lines);
    grow(...placed.box);
    return {
      id: sm.st.id, aria: `${sm.st.name}, ${yearsOf(sm.st)}`, major: sm.kind !== 'station',
      themes: [...new Set(sm.dots.map((d) => d.track.theme))].join(' '),
      connectors, dots, label: { lines, x: placed.x, y: placed.y, anchor: placed.anchor },
    };
  });

  // No terminal discs (owner decision; rule 26) and no time axis (rule 39).
  const discs: Plan['discs'] = [];
  const axis: Plan['axis'] = [];
  const td = today as Plan['today'];
  if (td) grow(td.x - (horiz ? 50 : 0), td.y - 12, td.x + (horiz ? 0 : 50), td.y + 4);
  return { box, tracks, casings: casings(model.tracks, layout, s), stations, discs, axis, today };
}

type Sel<E extends Element> = Selection<E, unknown, any, unknown>;
const layer = (svg: Sel<SVGSVGElement>, name: string): Sel<SVGGElement> =>
  svg.selectAll<SVGGElement, null>(`g.tm-layer-${name}`).data([null]).join('g').attr('class', `tm-layer-${name}`) as Sel<SVGGElement>;

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


  // Rule 8: crossing tracks below, then casings, then straight-through tracks on top.
  const drawTracks = (name: string, list: Plan['tracks'], cls = 'tm-track') => layer(svg, name)
    .selectAll<SVGPathElement, Plan['tracks'][number]>(`path.${cls}`).data(list, (d) => d.id).join('path')
    .attr('class', cls).attr('data-themes', (d) => d.theme).attr('d', (d) => d.d).attr('fill', 'none')
    .attr('stroke', (d) => d.colour)
    .attr('stroke-width', lw).attr('stroke-linecap', 'butt').attr('stroke-linejoin', 'round')
    // Rule 41: hover (mouse) or tap (touch) highlights the theme; tracks take no clicks.
    .on('pointerenter', (e: PointerEvent, d) => hoverIn(e, d.theme))
    .on('pointerleave', (e: PointerEvent) => hoverOut(e))
    .on('pointerup', (e: PointerEvent, d) => tapTrack(e, d.theme));
  drawTracks('tracks', p.tracks.filter((t) => !t.top));
  // Each crossing casing is masked to the track it crosses, so it never touches neighbours.
  const defs = svg.selectAll<SVGDefsElement, null>('defs.tm-defs').data([null]).join('defs').attr('class', 'tm-defs');
  defs.selectAll<SVGMaskElement, Plan['tracks'][number]>('mask').data(p.tracks, (t) => t.id).join('mask')
    .attr('id', (t) => `tm-mask-${t.id}`).attr('maskUnits', 'userSpaceOnUse').attr('x', 0).attr('y', 0).attr('width', W).attr('height', H)
    .selectAll<SVGPathElement, Plan['tracks'][number]>('path').data((t) => [t]).join('path')
    .attr('d', (t) => t.d).attr('fill', 'none').attr('stroke', '#fff').attr('stroke-width', lw).attr('stroke-linejoin', 'round');
  const casingLines = (name: string, cls: string, list: Casing[]) => layer(svg, name)
    .selectAll<SVGLineElement, Casing>(`line.${cls}`).data(list, (c) => c.key).join('line')
    .attr('class', cls).attr('data-themes', (c) => (c.raised ? c.theme : null)).attr('x1', (c) => c.x1).attr('y1', (c) => c.y1).attr('x2', (c) => c.x2).attr('y2', (c) => c.y2)
    .attr('mask', (c) => (c.mask ? `url(#tm-mask-${c.mask})` : null))
    .attr('stroke', CREAM).attr('stroke-width', (c) => c.w).attr('stroke-linecap', 'butt').attr('pointer-events', 'none');
  casingLines('casings', 'tm-casing', p.casings.filter((c) => !c.raised));
  drawTracks('tracks-top', p.tracks.filter((t) => t.top));
  // Highlighted tracks are lifted over the rest (rule 41): casings along them where they pass over
  // another track, then copies of every track. CSS shows only the ones of the active theme.
  casingLines('hl', 'tm-hl-casing', p.casings.filter((c) => c.raised));
  drawTracks('hl', p.tracks, 'tm-hl-track');

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
    .attr('aria-label', (d) => d.aria).attr('data-station', (d) => d.id).attr('data-themes', (d) => d.themes)
    .classed('is-selected', (d) => d.id === selected)
    .style('cursor', 'pointer')
    .on('click', (_e, d) => choose(d.id))
    .on('keydown', (e: KeyboardEvent, d) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') { e.preventDefault(); choose(d.id); }
    });
  sts.selectAll<SVGLineElement, Plan['stations'][number]['connectors'][number]>('line.tm-connector').data((d) => d.connectors, (c) => c.key).join('line')
    .attr('class', 'tm-connector').attr('data-themes', (c) => c.theme).attr('x1', (c) => c.x1).attr('y1', (c) => c.y1).attr('x2', (c) => c.x2).attr('y2', (c) => c.y2)
    .attr('stroke', INK).attr('stroke-width', 0.14 * lw);
  sts.selectAll<SVGCircleElement, Plan['stations'][number]['dots'][number]>('circle.tm-dot').data((d) => d.dots, (c) => c.key).join('circle')
    .attr('class', 'tm-dot').attr('data-themes', (c) => c.theme).attr('cx', (c) => c.cx).attr('cy', (c) => c.cy).attr('r', (DOT_D * lw) / 2).attr('fill', INK);
  sts.selectAll<SVGTextElement, Plan['stations'][number]['dots'][number]>('text.tm-dot-id').data((d) => d.dots, (c) => c.key).join('text')
    .attr('class', 'tm-dot-id').attr('x', (c) => c.cx).attr('y', (c) => c.cy)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('pointer-events', 'none')
    .attr('font-family', FONT).attr('font-weight', 700).attr('font-size', Math.max(LABEL_PX, 0.62 * lw)).attr('fill', WHITE).text((c) => c.label);
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
    .attr('class', 'tm-today').attr('x', (d) => d.x).attr('y', (d) => d.y).attr('text-anchor', p.today && scale.orientation === 'vertical' ? 'start' : 'end')
    .attr('font-family', FONT).attr('font-size', LABEL_PX).attr('font-weight', 700).attr('fill', INK).text('TODAY');

  registerMap(container);
  return { scale, model };
}
