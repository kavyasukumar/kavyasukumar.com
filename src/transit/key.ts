import { select, type Selection } from 'd3-selection';
import { DISC_D, DOT_D } from './geometry';
import { hatchId, hatchPatterns, INK, textOn } from './render';
import type { LineLayout, MapData } from './types';

type Row = { key: string; name: string; draw: (svg: Selection<SVGSVGElement, unknown, null, undefined>, lw: number, colour: string) => void; w: number };

const FONT = "'JetBrains Mono', ui-monospace, monospace";

/** Render the key into `container` at the current map lw (rules 32-34, 36, 38). Idempotent. */
export function renderKey(container: HTMLElement, data: MapData, layout: LineLayout, lw: number): void {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) return;
  const colour = line.colour;
  const themes = data.themes.filter((t) => t.line === line.id).sort((a, b) => a.num - b.num);
  const tracks = data.tracks.filter((t) => themes.some((th) => th.id === t.theme));
  const endedLabel = tracks.find((t) => !t.ongoing)?.label ?? '';

  const dot = (svg: Selection<SVGSVGElement, unknown, null, undefined>, cx: number, cy: number): void => {
    svg.append('circle').attr('class', 'tm-dot').attr('cx', cx).attr('cy', cy).attr('r', (DOT_D * lw) / 2).attr('fill', INK);
  };
  const bar = (svg: Selection<SVGSVGElement, unknown, null, undefined>, w: number, fill: string): void => {
    svg.append('rect').attr('class', 'tm-track').attr('x', 0).attr('y', 0).attr('width', w).attr('height', lw).attr('fill', fill);
  };

  const lineRows: Row[] = [
    { key: 'line', name: line.name, w: 3 * lw, draw: (svg) => bar(svg, 3 * lw, colour) },
    ...themes.map((th) => ({
      key: th.id,
      name: `${th.num} ${th.short} — ${tracks.filter((t) => t.theme === th.id).map((t) => t.label).join(', ')}`,
      w: 0,
      draw: () => undefined,
    })),
  ];
  const symbolRows: Row[] = [
    { key: 'station', name: 'Station', w: 3 * lw, draw: (svg) => dot(svg, 1.5 * lw, lw / 2) },
    { key: 'interchange', name: 'Interchange', w: 3 * lw, draw: (svg) => { dot(svg, 1.5 * lw - DOT_D * lw / 2, lw / 2); dot(svg, 1.5 * lw + DOT_D * lw / 2, lw / 2); } },
    {
      key: 'terminal', name: 'Terminal', w: 3 * lw,
      draw: (svg) => {
        svg.append('circle').attr('class', 'tm-disc').attr('cx', 1.5 * lw).attr('cy', lw / 2).attr('r', (DISC_D * lw) / 2).attr('fill', colour);
        svg.append('text').attr('class', 'tm-disc-id').attr('x', 1.5 * lw).attr('y', lw / 2).attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central').attr('font-family', FONT).attr('font-weight', 700).attr('font-size', 0.7 * lw)
          .attr('fill', textOn(colour)).text(endedLabel);
      },
    },
    {
      key: 'part-time', name: 'Part-time', w: 3 * lw,
      draw: (svg) => {
        hatchPatterns(svg.append('defs'), [colour], lw);
        bar(svg, 3 * lw, `url(#${hatchId(colour)})`);
      },
    },
    {
      key: 'ongoing', name: 'Runs on to today', w: 3 * lw,
      draw: (svg) => {
        bar(svg, 2.4 * lw, colour);
        svg.append('path').attr('d', `M${2.2 * lw} ${0.1 * lw}L${2.9 * lw} ${lw / 2}L${2.2 * lw} ${0.9 * lw}`)
          .attr('fill', 'none').attr('stroke', INK).attr('stroke-width', 0.14 * lw);
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
    .attr('class', 'tm-key-row').style('display', 'flex').style('align-items', 'center').style('gap', '0.75rem');
  const swatches = rows.selectAll<HTMLSpanElement, Row>('span.tm-key-swatch').data((r) => [r]).join('span')
    .attr('class', 'tm-key-swatch').style('flex', 'none').style('display', 'inline-block')
    .style('width', (r) => `${r.w}px`).style('height', `${Math.max(lw, (DISC_D * lw))}px`)
    .style('display', (r) => (r.w ? 'inline-flex' : 'none')).style('align-items', 'center');
  swatches.each(function (r) {
    const sel = select(this);
    sel.selectAll('svg').remove();
    if (!r.w) return;
    const h = DISC_D * lw;
    const svg = sel.append('svg').attr('width', r.w).attr('height', h).attr('viewBox', `0 ${-(h - lw) / 2} ${r.w} ${h}`)
      .attr('aria-hidden', 'true').style('overflow', 'visible') as Selection<SVGSVGElement, unknown, null, undefined>;
    r.draw(svg, lw, colour);
  });
  rows.selectAll<HTMLSpanElement, Row>('span.tm-key-name').data((r) => [r]).join('span')
    .attr('class', 'tm-key-name').text((r) => r.name);
}
