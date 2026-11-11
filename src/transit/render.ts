import { select, type Selection } from 'd3-selection';
import { hoverIn, hoverOut, registerMap, tapTrack } from './highlight';
import { connectorFor, CONNECTOR_W } from './connectors';
import { casings, type Casing } from './crossings';
import { DISC_D, DOT_D, END_OVERRUN, ID_DY, roundedPath, toXY } from './geometry';
import { LABEL_PX, LINE_H } from './labels';
import { dashedRun } from './ongoing';
import { buildModel, yearsOf, type Model } from './model';
import { stationLabel } from './station-label';
import { drawLegend, placeLegend, type Obstacles } from './symbols-legend';
import type { LineLayout, MapData, Orientation, Scale } from './types';

export const INK = '#0A0A0A';
const MUTED = '#555555';
const WHITE = '#FFFFFF';
const CREAM = '#F4E9D5'; // map background, used for crossing casings (rule 19)
const FONT = "'JetBrains Mono', ui-monospace, monospace";
// Dots must hold a 12px track ID (rule 22), so a track is at least 16px wide.
const MIN_LW = 16;
const MAX_LW = 22;
const H_SWITCH_LW = 15;
const PAD = 24;
// No time axis (rule 39): only order matters.
const AXIS_ROW = 12;
const AXIS_COL = PAD;
const VPAD = 6; // side margin of the vertical (phone) layout
const FLOOR_LW = 8; // phone lw floor (rule 22, PH1): below it the map frame scrolls sideways instead

/** `symbolsInMap`: false when the symbols legend has no room in the canvas (phone) and goes below the frame. */
export interface RenderResult { scale: Scale; model: Model; symbolsInMap: boolean }

/** Choose orientation and lw for a container width. Fits content by iterating on measured extent. */
export function chooseScale(width: number, model: Model, layout: LineLayout): { scale: Scale; box: Box; canvasW: number } {
  const tryFit = (o: Orientation): { lw: number; scale: Scale; box: Box } => {
    const slotGap = layout.slotGap[o];
    const slots = Object.values(layout.stations).map((st) => st.slot);
    const span = (Math.max(...slots) - Math.min(...slots)) * slotGap + 4;
    let lw = o === 'horizontal' ? (width - 2 * PAD) / span : 12;
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
  // The desktop floor is also the switch point (rule 22): a fit below it goes vertical, so the
  // horizontal map is never clamped up past its frame and no label clips.
  if (h.lw < (layout.minLw ?? H_SWITCH_LW)) return fitVertical(width, model, layout);
  const lw = Math.min(MAX_LW, Math.max(layout.minLw ?? MIN_LW, h.lw));
  const m = measure('horizontal', lw, width, model, layout);
  const b = m.box;
  const used = b.x1 - b.x0;
  const originX = Math.max(PAD, (width - used) / 2) - b.x0;
  const originY = AXIS_ROW - b.y0;
  return { scale: { ...m.scale, originX, originY }, box: b, canvasW: width };
}

/**
 * Vertical (phone) layout: the widest lw, up to MAX_LW, whose drawing fits between VPAD margins.
 * It may drop below minLw on a phone so nothing is clipped, but not below FLOOR_LW: there the
 * canvas grows past the frame, which scrolls sideways (rule 22, PH1). The drawing hugs the left
 * margin, so the ribbon sits as far west as the fans and labels allow (rules 22, 40; owner decision).
 */
function fitVertical(width: number, model: Model, layout: LineLayout): { scale: Scale; box: Box; canvasW: number } {
  const avail = width - 2 * VPAD;
  const fits = (lw: number): boolean => { const b = measure('vertical', lw, width, model, layout).box; return b.x1 - b.x0 <= avail; };
  let lw = MAX_LW;
  if (!fits(lw)) {
    let lo = 1; let hi = MAX_LW;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (fits(mid)) lo = mid; else hi = mid; }
    lw = Math.max(FLOOR_LW, lo);
  }
  const m = measure('vertical', lw, width, model, layout);
  const b = m.box;
  const canvasW = Math.max(width, Math.ceil(b.x1 - b.x0 + 2 * VPAD));
  const originX = Math.max(VPAD, (canvasW - (b.x1 - b.x0)) / 2) - b.x0;
  return { scale: { ...m.scale, originX, originY: PAD / 2 - b.y0 }, box: b, canvasW };
}

interface Box { x0: number; y0: number; x1: number; y1: number }

function measure(o: Orientation, lw: number, width: number, model: Model, layout: LineLayout): { scale: Scale; box: Box } {
  const scale: Scale = { orientation: o, lw, slotGap: layout.slotGap[o], originX: 0, originY: 0 };
  const p = plan(model, layout, scale, width, 0);
  return { scale, box: p.box };
}

interface Plan {
  box: Box;
  tracks: { id: string; theme: string; d: string; pts: [number, number][]; colour: string; top: boolean; low: boolean; dash: string | null }[];
  casings: Casing[];
  lowCasings: Casing[];
  stations: {
    id: string; aria: string; major: boolean; themes: string;
    connectors: { key: string; d: string; themes: string }[];
    dots: { key: string; theme: string; cx: number; cy: number; label: string; square: boolean; glyph: string }[];
    label: { lines: string[]; x: number; y: number; anchor: string; box: [number, number, number, number] };
  }[];
  discs: { key: string; cx: number; cy: number; label: string; text: string }[];
  axis: { key: string; x: number; y: number; anchor: string; text: string }[];
}

function luminance(hex: string): number {
  const n = parseInt(hex.replace('#', ''), 16);
  const f = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f((n >> 16) & 255) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255);
}
export const textOn = (colour: string): string => (luminance(colour) > 0.3 ? INK : WHITE);
/** WCAG 2 contrast ratio between two hex colours. */
export const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
// Rule 22: a highlighted station's ID takes its own track's line colour, unless that line is dark
// (contrast against the Ink dot below 4.5:1), which gets a Cream ID instead. Computed, not by line name.
const DARK_LINE = 4.5;
export const glyphOn = (lineColour: string): string => (contrast(lineColour, INK) < DARK_LINE ? CREAM : lineColour);

// frameW: the frame's width; it sets the wrap budget of vFrameWrap labels (the canvas can be wider at the lw floor).
function plan(model: Model, layout: LineLayout, s: Scale, W: number, H: number, frameW = W): Plan {
  const { lw } = s;
  const horiz = s.orientation === 'horizontal';
  const box: Box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const grow = (x0: number, y0: number, x1: number, y1: number) => {
    box.x0 = Math.min(box.x0, x0); box.y0 = Math.min(box.y0, y0);
    box.x1 = Math.max(box.x1, x1); box.y1 = Math.max(box.y1, y1);
  };
  const over = END_OVERRUN * lw;
  // A track that truly ends at a stop stops at its square's centre, with no overrun (rule 26).
  const endAt = new Map<string, [number, number]>();
  for (const sm of model.stations) for (const d of sm.dots) if (d.square) endAt.set(d.track.id, toXY(d.slot, d.lane, s));

  const tracks: Plan['tracks'] = model.tracks.flatMap((t) => {
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
    const end: [number, number] = endAt.get(t.id) ?? [last[0] + l[0] * over, last[1] + l[1] * over];
    for (const q of [start, ...pts, end]) grow(q[0] - lw / 2, q[1] - lw / 2, q[0] + lw / 2, q[1] + lw / 2);
    const tl = layout.tracks[t.id]!;
    const colour = model.colours[t.theme] ?? model.line.colour;
    const line: [number, number][] = [start, ...pts.slice(1, -1), end];
    const solid: Plan['tracks'][number] = { id: t.id, theme: t.theme, colour, top: !!tl.top, low: !!tl.low, dash: null,
      pts: line, d: roundedPath(line, (tl.radii ?? [1.5]).map((r) => r * lw)) };
    if (!t.ongoing) return [solid];
    // Ongoing work runs on dashed past its last stop and off the canvas edge (rule 27).
    const run = dashedRun(end, l, lw, W, H);
    if (H === 0) grow(run.to[0] - lw / 2, run.to[1] - lw / 2, run.to[0] + lw / 2, run.to[1] + lw / 2);
    return [solid, { ...solid, id: `${t.id}~dash`, pts: [run.from, run.to], d: run.d, dash: run.dash }];
  });

  const vBudget = (w: number): number => Math.min(150, Math.max(72, w * 0.28));
  const budget = horiz ? s.slotGap * lw * 0.92 : vBudget(W);
  const stations: Plan['stations'] = model.stations.map((sm) => {
    const dots = sm.dots.map((d) => {
      const [cx, cy] = toXY(d.slot, d.lane, s);
      grow(cx - lw / 2, cy - lw / 2, cx + lw / 2, cy + lw / 2);
      const glyph = glyphOn(model.colours[d.track.theme] ?? model.line.colour);
      return { key: d.track.id, theme: d.track.theme, cx, cy, label: d.track.label, square: d.square, glyph };
    });
    // Every interchange's dots are joined by a thin connector, even where they touch (rules 24, 25).
    const conn = connectorFor(sm.st.id, sm.dots.map((d) => ({ trackId: d.track.id, slot: d.slot, lane: d.lane })), layout, s);
    const themes = [...new Set(sm.dots.map((d) => d.track.theme))].join(' ');
    const connectors = conn ? [{ ...conn, themes }] : [];
    const placed = stationLabel(sm, layout, s, budget, horiz ? budget : vBudget(frameW));
    grow(...placed.box);
    return {
      id: sm.st.id, aria: `${sm.st.name}, ${yearsOf(sm.st)}`, major: sm.kind !== 'station',
      themes, connectors, dots, label: { lines: placed.lines, x: placed.x, y: placed.y, anchor: placed.anchor, box: placed.box },
    };
  });

  // No terminal discs (owner decision; rule 26) and no time axis (rule 39).
  const discs: Plan['discs'] = [];
  const axis: Plan['axis'] = [];
  return { box, tracks, casings: casings(model.tracks, layout, s), lowCasings: casings(model.tracks, layout, s, true), stations, discs, axis };
}

type Sel<E extends Element> = Selection<E, unknown, any, unknown>;
const layer = (svg: Sel<SVGSVGElement>, name: string): Sel<SVGGElement> =>
  svg.selectAll<SVGGElement, null>(`g.tm-layer-${name}`).data([null]).join('g').attr('class', `tm-layer-${name}`) as Sel<SVGGElement>;

export function renderMap(container: HTMLElement, data: MapData, layout: LineLayout): RenderResult {
  const frameW = Math.max(1, Math.round(container.clientWidth || container.getBoundingClientRect().width));
  let model = buildModel(data, layout);
  let fit = chooseScale(frameW, model, layout);
  // The vertical (phone) map may have its own spacing (R1, R3 desktop only); refit with it.
  if (fit.scale.orientation === 'vertical' && layout.vertical) {
    layout = layout.vertical;
    model = buildModel(data, layout);
    fit = fitVertical(frameW, model, layout);
  }
  const { scale, canvasW: W } = fit;
  const bbox = plan(model, layout, scale, W, 0, frameW).box;
  const horiz = scale.orientation === 'horizontal';
  let H = Math.ceil(bbox.y1 + (horiz ? 20 : PAD));
  let p = plan(model, layout, scale, W, H, frameW);
  const lw = scale.lw;
  // Symbols legend (rule 34) in the bottom-left corner. Desktop: the canvas may grow to fit it
  // (its ongoing tracks run off the right edge, so growing does not move them). Phone: only if it
  // fits as is (growing would lengthen the dashes that run off the bottom); otherwise below the frame.
  const sym = placeLegend(obstaclesOf(p, lw), p.box.x0, p.box.y1, Math.max(lw, 12));
  const symbolsInMap = horiz || sym.y1 <= p.box.y1;
  if (horiz && Math.ceil(sym.y1 + 20) > H) { H = Math.ceil(sym.y1 + 20); p = plan(model, layout, scale, W, H, frameW); }

  const root = select(container);
  const svg = root.selectAll<SVGSVGElement, null>('svg.tm-svg').data([null]).join('svg')
    .attr('class', 'tm-svg').attr('width', W).attr('height', H)
    .attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'group')
    .attr('aria-label', `${model.line.name} line`)
    // Wider than its frame only at the phone lw floor; the frame then scrolls sideways (PH1).
    .style('min-width', () => (W > frameW ? `${W}px` : null))
    // Connector width for its hover scaling (CSS).
    .style('--tm-cw', `${CONNECTOR_W * lw}px`) as Sel<SVGSVGElement>;

  // Rule 8: crossing tracks below, then casings, then straight-through tracks on top.
  const drawTracks = (name: string, list: Plan['tracks'], cls = 'tm-track') => layer(svg, name)
    .selectAll<SVGPathElement, Plan['tracks'][number]>(`path.${cls}`).data(list, (d) => d.id).join('path')
    .attr('class', cls).attr('data-themes', (d) => d.theme).attr('d', (d) => d.d).attr('fill', 'none')
    .attr('stroke', (d) => d.colour)
    .attr('stroke-width', lw).attr('stroke-linecap', 'butt').attr('stroke-linejoin', 'round')
    .attr('stroke-dasharray', (d) => d.dash)
    // Rule 41: hover (mouse) or tap (touch) highlights the theme; tracks take no clicks.
    .on('pointerenter', (e: PointerEvent, d) => hoverIn(e, d.theme))
    .on('pointerleave', (e: PointerEvent) => hoverOut(e))
    .on('pointerup', (e: PointerEvent, d) => tapTrack(e, d.theme));
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
  // A `low` track runs beneath everything; the tracks passing over it cut it with a casing first (rule 19).
  drawTracks('tracks-low', p.tracks.filter((t) => t.low));
  casingLines('casings-low', 'tm-casing', p.lowCasings);
  drawTracks('tracks', p.tracks.filter((t) => !t.top && !t.low));
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
  // Connectors sit under the dots, inside the station group, so they inherit its themes for the
  // grey-out and draw above the hover-on-top (hl) layer like the dots do (rule 41).
  sts.selectAll<SVGPathElement, Plan['stations'][number]['connectors'][number]>('path.tm-connector').data((d) => d.connectors, (c) => c.key).join('path')
    .attr('class', 'tm-connector').attr('data-themes', (c) => c.themes)
    .attr('d', (c) => c.d).attr('fill', 'none').attr('stroke', INK).attr('stroke-width', CONNECTOR_W * lw)
    .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round').attr('pointer-events', 'none');
  sts.selectAll<SVGCircleElement, Plan['stations'][number]['dots'][number]>('circle.tm-dot').data((d) => d.dots.filter((c) => !c.square), (c) => c.key).join('circle')
    .attr('class', 'tm-dot').attr('data-themes', (c) => c.theme).attr('cx', (c) => c.cx).attr('cy', (c) => c.cy).attr('r', (DOT_D * lw) / 2).attr('fill', INK);
  // Tracks that truly end here: sharp-cornered squares, same size, fill and hover state as the dots (rule 26).
  sts.selectAll<SVGRectElement, Plan['stations'][number]['dots'][number]>('rect.tm-dot').data((d) => d.dots.filter((c) => c.square), (c) => c.key).join('rect')
    .attr('class', 'tm-dot tm-dot-square').attr('data-themes', (c) => c.theme)
    .attr('x', (c) => c.cx - (DOT_D * lw) / 2).attr('y', (c) => c.cy - (DOT_D * lw) / 2)
    .attr('width', DOT_D * lw).attr('height', DOT_D * lw).attr('fill', INK);
  sts.selectAll<SVGTextElement, Plan['stations'][number]['dots'][number]>('text.tm-dot-id').data((d) => d.dots, (c) => c.key).join('text')
    .attr('class', 'tm-dot-id').attr('x', (c) => c.cx).attr('y', (c) => c.cy)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'central').attr('dy', ID_DY).attr('pointer-events', 'none')
    .attr('font-family', FONT).attr('font-weight', 700).attr('font-size', Math.max(LABEL_PX, 0.62 * lw)).attr('fill', WHITE)
    // Highlight colour of this ID: its own track's line, or Cream on a dark line (CSS, rule 22).
    .style('--tm-dot-line', (c) => c.glyph).text((c) => c.label);
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

  const symLayer = layer(svg, 'symbols');
  symLayer.selectAll<SVGGElement, null>('g.tm-symbols').data(symbolsInMap ? [null] : []).join('g')
    .attr('transform', `translate(${sym.x0},${sym.y0})`).each(function () { drawLegend(select(this), lw); });

  registerMap(container);
  return { scale, model, symbolsInMap };
}

/** Track centre lines, dot hulls (which cover the connectors) and label boxes of a plan. */
function obstaclesOf(p: Plan, lw: number): Obstacles {
  const boxes: Obstacles['boxes'] = [];
  for (const st of p.stations) {
    const [b0, b1, b2, b3] = st.label.box;
    boxes.push({ x0: b0, y0: b1, x1: b2, y1: b3 });
    if (!st.dots.length) continue;
    const xs = st.dots.map((d) => d.cx); const ys = st.dots.map((d) => d.cy);
    boxes.push({ x0: Math.min(...xs) - lw / 2, y0: Math.min(...ys) - lw / 2, x1: Math.max(...xs) + lw / 2, y1: Math.max(...ys) + lw / 2 });
  }
  return { lines: p.tracks.map((t) => t.pts), boxes, lw };
}
