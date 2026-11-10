import { select, type Selection } from 'd3-selection';
import { DOT_D, END_OVERRUN, PITCH } from './geometry';
import { focusIn, focusOut, hoverIn, hoverOut, registerKey } from './highlight';
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
  const ended = tracks.find((t) => !t.ongoing);
  const ongoing = tracks.find((t) => t.ongoing);
  const first = tracks[0];
  const other = tracks.find((t) => first && t.theme !== first.theme) ?? tracks[1];
  const idOf = (t: MapTrack | undefined): string => t?.label ?? '';

  // Key symbols are drawn exactly as the map draws them (rule 34): solid tracks
  // 1 lw wide, black dots 1 lw across carrying the track ID in white (rule 22).
  const SW = 4 * lw; // swatch area width; the ongoing track runs out to its right edge
  const CX = 1.5 * lw; // dot centre, the same in every symbol row
  const track = (svg: Svg, x0: number, x1: number, cy: number): void => {
    svg.append('rect').attr('class', 'tm-key-track').attr('x', x0).attr('y', cy - lw / 2)
      .attr('width', x1 - x0).attr('height', lw).attr('fill', colour);
  };
  const dot = (svg: Svg, cy: number, id: string): void => {
    svg.append('circle').attr('class', 'tm-dot').attr('cx', CX).attr('cy', cy).attr('r', (DOT_D * lw) / 2).attr('fill', INK);
    svg.append('text').attr('class', 'tm-dot-id').attr('x', CX).attr('y', cy).attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central').attr('font-family', FONT).attr('font-weight', 700)
      .attr('font-size', ID_PX(lw)).attr('fill', '#FFFFFF').text(id);
  };
  const mid = lw / 2;

  const lineRows: Row[] = [
    { key: 'line', name: line.name, w: SW, h: lw, draw: (svg) => track(svg, 0, SW, mid) },
    ...themes.map((th) => ({
      key: th.id,
      theme: th.id,
      name: `${th.num} ${th.short} — ${tracks.filter((t) => t.theme === th.id).map((t) => t.label).join(', ')}`,
      w: 0,
      h: 0,
      draw: () => undefined,
    })),
  ];
  const symbolRows: Row[] = [
    { key: 'station', name: 'Station', w: SW, h: lw, draw: (svg) => { track(svg, 0, 3 * lw, mid); dot(svg, mid, idOf(first)); } },
    {
      key: 'interchange', name: 'Interchange', w: SW, h: (1 + PITCH) * lw,
      draw: (svg) => {
        const y2 = mid + PITCH * lw;
        track(svg, 0, 3 * lw, mid); track(svg, 0, 3 * lw, y2);
        dot(svg, mid, idOf(first)); dot(svg, y2, idOf(other));
      },
    },
    // Rule 26: a terminal ends square about 0.6 lw past its last dot, no marker.
    { key: 'terminal', name: 'Terminal', w: SW, h: lw, draw: (svg) => { track(svg, 0, CX + END_OVERRUN * lw, mid); dot(svg, mid, idOf(ended)); } },
    // Rule 27: ongoing work runs off the edge, clipped flat, no end mark.
    { key: 'ongoing', name: 'Runs on to today', w: SW, h: lw, draw: (svg) => { track(svg, 0, SW, mid); dot(svg, mid, idOf(ongoing)); } },
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
