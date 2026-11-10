import { select, type Selection } from 'd3-selection';
import { CONNECTOR_W } from './connectors';
import { DOT_D, END_OVERRUN, PITCH } from './geometry';
import { focusIn, focusOut, hoverIn, hoverOut, registerKey } from './highlight';
import { DASH, DASH_GAP } from './ongoing';
import { INK } from './render';
import type { LineLayout, MapData, MapTrack } from './types';

type Svg = Selection<SVGSVGElement, unknown, null, undefined>;
type Row = { key: string; theme?: string; name: string; draw: (svg: Svg) => void; w: number; h: number };

const FONT = "'JetBrains Mono', ui-monospace, monospace";
// Same ID size as the map's dots (render.ts: max(LABEL_PX, 0.62 lw)).
const ID_PX = (lw: number): number => Math.max(12, 0.62 * lw);

/** Render the key into `container` at the current map lw (rules 32-34, 36, 38). Idempotent. */
export function renderKey(container: HTMLElement, data: MapData, layout: LineLayout, lw: number): void {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) return;
  const colour = line.colour;
  const themes = data.themes.filter((t) => t.line === line.id).sort((a, b) => a.num - b.num);
  const tracks = data.tracks.filter((t) => themes.some((th) => th.id === t.theme));
  const first = tracks[0];
  const other = tracks.find((t) => first && t.theme !== first.theme) ?? tracks[1];
  // Dots show the theme number only, no letters (rules 22, 38).
  const idOf = (t: MapTrack | undefined): string => t?.label ?? '';

  // Key symbols are drawn exactly as the map draws them (rule 34): solid tracks
  // 1 lw wide, black dots 1 lw across carrying the track ID in white (rule 22).
  // Every symbol swatch is this wide so names line up (rule 36); the ongoing track's dashes
  // are cut at its right edge, as the map's are at the frame.
  const BW = 5 * lw;
  const CX = 1.5 * lw; // dot centre, the same in every symbol row
  const track = (svg: Svg, x0: number, x1: number, cy: number): void => {
    svg.append('rect').attr('class', 'tm-key-track').attr('x', x0).attr('y', cy - lw / 2)
      .attr('width', x1 - x0).attr('height', lw).attr('fill', colour);
  };
  const dot = (svg: Svg, cy: number, id: string, square = false): void => {
    const d = DOT_D * lw;
    if (square) svg.append('rect').attr('class', 'tm-dot tm-dot-square').attr('x', CX - d / 2).attr('y', cy - d / 2).attr('width', d).attr('height', d).attr('fill', INK);
    else svg.append('circle').attr('class', 'tm-dot').attr('cx', CX).attr('cy', cy).attr('r', d / 2).attr('fill', INK);
    svg.append('text').attr('class', 'tm-dot-id').attr('x', CX).attr('y', cy).attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central').attr('font-family', FONT).attr('font-weight', 700)
      .attr('font-size', ID_PX(lw)).attr('fill', '#FFFFFF').text(id);
  };
  const mid = lw / 2;

  const lineRows: Row[] = [
    { key: 'line', name: line.name, w: BW, h: lw, draw: (svg) => track(svg, 0, BW, mid) },
    // Each track once, number and name; branches are not listed (rule 33).
    ...themes.map((th) => ({
      key: th.id,
      theme: th.id,
      name: `${th.num} ${th.short}`,
      w: 0,
      h: 0,
      draw: () => undefined,
    })),
  ];
  const symbolRows: Row[] = [
    // A short track running through its dot.
    { key: 'station', name: 'Station', w: BW, h: lw, draw: (svg) => { track(svg, 0, 3 * lw, mid); dot(svg, mid, idOf(first)); } },
    {
      key: 'interchange', name: 'Interchange', w: BW, h: (1 + PITCH) * lw,
      draw: (svg) => {
        const y2 = mid + PITCH * lw;
        track(svg, 0, 3 * lw, mid); track(svg, 0, 3 * lw, y2);
        // The same thin Ink connector the map draws between interchange dots (rule 24).
        svg.append('line').attr('class', 'tm-connector').attr('x1', CX).attr('x2', CX).attr('y1', mid).attr('y2', y2)
          .attr('stroke', INK).attr('stroke-width', CONNECTOR_W * lw).attr('stroke-linecap', 'round');
        dot(svg, mid, idOf(first)); dot(svg, y2, idOf(other));
      },
    },
    // Rule 26: a terminal's dot is a square and the track ends at its centre, no overrun.
    { key: 'terminal', name: 'Terminal', w: BW, h: lw, draw: (svg) => { track(svg, 0, CX, mid); dot(svg, mid, idOf(first), true); } },
    // Rule 27: ongoing work is solid to just past its dot, then dashed (1 lw dash, 0.5 lw gap)
    // off the edge, here cut at the swatch's edge as the map's are at the frame.
    {
      key: 'ongoing', name: 'Ongoing', w: BW, h: lw,
      draw: (svg) => {
        const solidEnd = CX + END_OVERRUN * lw;
        track(svg, 0, solidEnd, mid);
        svg.append('line').attr('class', 'tm-key-dash').attr('x1', solidEnd + DASH_GAP * lw).attr('x2', BW)
          .attr('y1', mid).attr('y2', mid).attr('stroke', colour).attr('stroke-width', lw)
          .attr('stroke-linecap', 'butt').attr('stroke-dasharray', `${DASH * lw} ${DASH_GAP * lw}`);
        dot(svg, mid, idOf(first));
      },
    },
  ];

  const root = select(container);
  const key = root.selectAll<HTMLDivElement, null>('div.tm-key').data([null]).join('div').attr('class', 'tm-key');
  const groups = key.selectAll<HTMLDivElement, { heading: string; rows: Row[] }>('div.tm-key-group')
    .data([{ heading: 'Lines', rows: lineRows }, { heading: 'Symbols', rows: symbolRows }], (g) => g.heading).join('div')
    .attr('class', 'tm-key-group')
    .style('border-top', (_g, i) => (i === 0 ? null : `1px solid ${INK}`));
  groups.selectAll<HTMLElement, { heading: string }>('h3.tm-key-heading').data((g) => [g]).join('h3')
    .attr('class', 'tm-key-heading').text((g) => g.heading);
  const rows = groups.selectAll<HTMLDivElement, Row>('div.tm-key-row').data((g) => g.rows, (r) => r.key).join('div')
    .attr('class', 'tm-key-row').style('display', 'flex').style('align-items', 'center').style('gap', '0.75rem')
    // Rule 41: theme rows highlight their theme on hover and keyboard focus.
    .attr('data-themes', (r) => r.theme ?? null).attr('tabindex', (r) => (r.theme ? 0 : null))
    .on('pointerenter', (e: PointerEvent, r) => { if (r.theme) hoverIn(e, r.theme); })
    .on('pointerleave', (e: PointerEvent, r) => { if (r.theme) hoverOut(e); })
    .on('focus', (_e, r) => { if (r.theme) focusIn(r.theme); })
    .on('blur', (_e, r) => { if (r.theme) focusOut(); });
  const swatches = rows.selectAll<HTMLSpanElement, Row>('span.tm-key-swatch').data((r) => [r]).join('span')
    .attr('class', 'tm-key-swatch').style('flex', 'none').style('display', 'inline-block')
    .style('width', (r) => `${r.w}px`).style('height', (r) => `${r.h}px`)
    .style('display', (r) => (r.w ? 'inline-flex' : 'none')).style('align-items', 'center');
  swatches.each(function (r) {
    const sel = select(this);
    sel.selectAll('svg').remove();
    if (!r.w) return;
    const svg = sel.append('svg').attr('width', r.w).attr('height', r.h).attr('viewBox', `0 0 ${r.w} ${r.h}`)
      .attr('aria-hidden', 'true').style('display', 'block').style('overflow', 'hidden') as Svg;
    r.draw(svg);
  });
  rows.selectAll<HTMLSpanElement, Row>('span.tm-key-name').data((r) => [r]).join('span')
    .attr('class', 'tm-key-name').text((r) => r.name);
  registerKey(container);
}
