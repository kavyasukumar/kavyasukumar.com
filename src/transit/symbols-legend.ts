// Map symbols legend (rule 34): Station / Interchange / Terminal / Ongoing, drawn at map scale.
// Desktop: inside the map SVG, in the bottom-left corner, in free space found from the plan's
// geometry. Phone (vertical layout): when it does not fit in the canvas, a small Cream tile below
// the map frame. Static: no data-themes, no tm-dot/tm-track classes (so the highlight CSS never
// greys it), no pointer events.
import { select, type Selection } from 'd3-selection';
import { CONNECTOR_W } from './connectors';
import { DOT_D, END_OVERRUN, ID_DY, PITCH } from './geometry';
import { CHAR_W, LABEL_PX } from './labels';
import { DASH, DASH_GAP } from './ongoing';

type G = Selection<SVGGElement, unknown, any, unknown>;
type Pt = [number, number];

const INK = '#0A0A0A';
const CREAM = '#F4E9D5';
const WHITE = '#FFFFFF';
const MUTED = '#555555'; // plain station label and key heading grey
/** Swatch track grey: --tm-grey-ink, the map's greyed-dot / greyed-label colour (≈4.9:1 on Cream). */
export const SYMBOL_GREY = '#6F6A61';
const FONT = "'JetBrains Mono', ui-monospace, monospace";
const HEAD_H = 20; // heading line (12 px caps) plus the gap below it
const NAME_GAP = 12; // swatch to name, as in the key (rule 36)
const ROWS = [
  { key: 'station', name: 'Station', h: 1 },
  { key: 'interchange', name: 'Interchange', h: 1 + PITCH },
  { key: 'terminal', name: 'Terminal', h: 1 },
  { key: 'ongoing', name: 'Ongoing', h: 1 },
] as const;
type RowKey = (typeof ROWS)[number]['key'];

const rowGap = (lw: number): number => Math.max(8, 0.6 * lw);
const swatchW = (lw: number): number => 5 * lw;

/** Legend size in px at line width `lw`. */
export function legendSize(lw: number): { w: number; h: number } {
  const names = Math.max(...ROWS.map((r) => r.name.length)) * CHAR_W;
  const head = 'SYMBOLS'.length * CHAR_W * 1.1;
  const h = HEAD_H + ROWS.reduce((s, r) => s + r.h * lw, 0) + (ROWS.length - 1) * rowGap(lw);
  return { w: Math.ceil(Math.max(head, swatchW(lw) + NAME_GAP + names)), h: Math.ceil(h) };
}

// ---- Placement ---------------------------------------------------------------------------------

export interface Box { x0: number; y0: number; x1: number; y1: number }
/** Everything drawn on the map: track centre polylines (stroke lw wide), dot hulls and label boxes. */
export interface Obstacles { lines: Pt[][]; boxes: Box[]; lw: number }

/** Lowest y any obstacle reaches inside the column [x0, x1] (-Infinity if the column is empty). */
function floorIn(o: Obstacles, x0: number, x1: number): number {
  let y = -Infinity;
  const r = o.lw / 2;
  for (const b of o.boxes) if (b.x1 > x0 && b.x0 < x1) y = Math.max(y, b.y1);
  for (const pts of o.lines) {
    for (let i = 1; i < pts.length; i++) {
      const [a, c] = [pts[i - 1]!, pts[i]!];
      const lo = x0 - r; const hi = x1 + r;
      if (Math.max(a[0], c[0]) < lo || Math.min(a[0], c[0]) > hi) continue;
      const at = (x: number): number => (c[0] === a[0] ? Math.max(a[1], c[1]) : a[1] + ((x - a[0]) / (c[0] - a[0])) * (c[1] - a[1]));
      const xa = Math.max(lo, Math.min(a[0], c[0])); const xb = Math.min(hi, Math.max(a[0], c[0]));
      y = Math.max(y, at(xa) + r, at(xb) + r);
    }
  }
  return y;
}

/**
 * Bottom-left spot for the legend: left edge at `left`, bottom at `bottom` (the drawing's lowest
 * edge), pushed down below anything in its column with `clear` px to spare. The caller grows the
 * canvas if the result runs past `bottom`.
 */
export function placeLegend(o: Obstacles, left: number, bottom: number, clear: number): Box {
  const { w, h } = legendSize(o.lw);
  const floor = floorIn(o, left - clear, left + w + clear);
  const y0 = Math.max(bottom - h, floor + clear);
  return { x0: left, y0, x1: left + w, y1: y0 + h };
}

// ---- Drawing -----------------------------------------------------------------------------------

/** Draw the legend into `g` with its top-left at (0, 0). Idempotent. */
export function drawLegend(g: G, lw: number): void {
  g.attr('class', 'tm-symbols').attr('role', 'group').attr('aria-label', 'Map symbols').attr('pointer-events', 'none');
  g.selectAll<SVGTextElement, null>('text.tm-sym-heading').data([null]).join('text')
    .attr('class', 'tm-sym-heading').attr('aria-hidden', 'true').attr('x', 0).attr('y', 10)
    .attr('font-family', FONT).attr('font-size', LABEL_PX).attr('font-weight', 700).attr('letter-spacing', '0.1em')
    .attr('fill', MUTED).text('SYMBOLS');
  let y = HEAD_H;
  const placed = ROWS.map((r) => { const top = y; y += r.h * lw + rowGap(lw); return { ...r, top }; });
  const rows = g.selectAll<SVGGElement, (typeof placed)[number]>('g.tm-sym-row').data(placed, (r) => r.key).join('g')
    .attr('class', 'tm-sym-row').attr('role', 'img').attr('aria-label', (r) => r.name)
    .attr('transform', (r) => `translate(0,${r.top})`);
  rows.each(function (r) {
    const row = select(this) as G;
    row.selectAll('*').remove();
    swatch(row.append('g').attr('aria-hidden', 'true') as G, r.key, lw);
    row.append('text').attr('class', 'tm-sym-name').attr('aria-hidden', 'true')
      .attr('x', swatchW(lw) + NAME_GAP).attr('y', (r.h * lw) / 2).attr('dominant-baseline', 'central')
      .attr('font-family', FONT).attr('font-size', LABEL_PX).attr('fill', MUTED).text(r.name);
  });
}

/** One symbol, exactly as the map draws it (rule 34) but with grey tracks. */
function swatch(g: G, key: RowKey, lw: number): void {
  const BW = swatchW(lw);
  const CX = 1.5 * lw; // dot centre, the same in every row
  const mid = lw / 2;
  const track = (x0: number, x1: number, cy: number): void => {
    g.append('rect').attr('x', x0).attr('y', cy - lw / 2).attr('width', x1 - x0).attr('height', lw).attr('fill', SYMBOL_GREY);
  };
  const dot = (cy: number, id: string, square = false): void => {
    const d = DOT_D * lw;
    const shape: Selection<any, unknown, any, unknown> = square
      ? g.append('rect').attr('x', CX - d / 2).attr('y', cy - d / 2).attr('width', d).attr('height', d)
      : g.append('circle').attr('cx', CX).attr('cy', cy).attr('r', d / 2);
    // The map's Ink dot with its cream ring (dataviz.html .tm-dot).
    shape.attr('fill', INK).attr('stroke', CREAM).attr('stroke-width', 1.2).attr('paint-order', 'stroke');
    g.append('text').attr('x', CX).attr('y', cy).attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('dy', ID_DY).attr('font-family', FONT).attr('font-weight', 700).attr('font-size', Math.max(LABEL_PX, 0.62 * lw))
      .attr('fill', WHITE).text(id);
  };
  if (key === 'station') { track(0, 3 * lw, mid); dot(mid, 'A'); return; }
  if (key === 'interchange') {
    const y2 = mid + PITCH * lw;
    track(0, 3 * lw, mid); track(0, 3 * lw, y2);
    // The thin Ink connector the map draws between interchange dots (rule 24).
    g.append('line').attr('x1', CX).attr('x2', CX).attr('y1', mid).attr('y2', y2)
      .attr('stroke', INK).attr('stroke-width', CONNECTOR_W * lw).attr('stroke-linecap', 'round');
    dot(mid, 'A'); dot(y2, 'B');
    return;
  }
  // Rule 26: a terminal's square, its track ending at the centre.
  if (key === 'terminal') { track(0, CX, mid); dot(mid, 'A', true); return; }
  // Rule 27: solid to just past the dot, then 1 lw dashes with 0.5 lw gaps, cut at the swatch edge.
  const solidEnd = CX + END_OVERRUN * lw;
  track(0, solidEnd, mid);
  g.append('line').attr('x1', solidEnd + DASH_GAP * lw).attr('x2', BW).attr('y1', mid).attr('y2', mid)
    .attr('stroke', SYMBOL_GREY).attr('stroke-width', lw).attr('stroke-linecap', 'butt')
    .attr('stroke-dasharray', `${DASH * lw} ${DASH_GAP * lw}`);
  dot(mid, 'A');
}

/**
 * Phone fallback: the same legend as a small SVG in `el` (a Cream tile below the map frame),
 * or hide `el` when the legend sits in the map.
 */
export function renderSymbolsBelow(el: HTMLElement, lw: number | null): void {
  if (lw === null) { el.hidden = true; select(el).selectAll('svg').remove(); return; }
  el.hidden = false;
  const { w, h } = legendSize(lw);
  const pad = 2; // room for the cream rings at the edges
  const svg = select(el).selectAll<SVGSVGElement, null>('svg').data([null]).join('svg')
    .attr('width', w + 2 * pad).attr('height', h + 2 * pad).attr('viewBox', `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`)
    .attr('role', 'none').style('display', 'block').style('overflow', 'visible');
  drawLegend(svg.selectAll<SVGGElement, null>('g.tm-symbols').data([null]).join('g') as G, lw);
}
