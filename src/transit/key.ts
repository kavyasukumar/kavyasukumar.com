import { select, type Selection } from 'd3-selection';
import { focusIn, focusOut, hoverIn, hoverOut, registerKey } from './highlight';
import { INK } from './render';
import { TRACK_LETTERS, type LineLayout, type MapData, type MapTheme } from './types';

type Svg = Selection<SVGSVGElement, unknown, null, undefined>;
type Row = { key: string; theme?: string; name: string; draw: (svg: Svg) => void; w: number; h: number };

/** Ribbon order: by track letter (A at the top). */
const byLetter = (a: MapTheme, b: MapTheme): number => TRACK_LETTERS.indexOf(a.letter) - TRACK_LETTERS.indexOf(b.letter);

/** Render the key into `container` at the current map lw (rules 32-34, 36, 38). Idempotent. */
export function renderKey(container: HTMLElement, data: MapData, layout: LineLayout, lw: number): void {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) return;
  const lines = (layout.lineIds ?? [line.id]).map((id) => data.lines.find((l) => l.id === id)).filter((l): l is NonNullable<typeof l> => !!l);

  // Line swatches are drawn as the map draws tracks (rule 34): solid, 1 lw wide.
  // Every swatch is this wide so names line up (rule 36).
  const BW = 5 * lw;
  const track = (svg: Svg, x0: number, x1: number, cy: number, fill: string): void => {
    svg.append('rect').attr('class', 'tm-key-track').attr('x', x0).attr('y', cy - lw / 2)
      .attr('width', x1 - x0).attr('height', lw).attr('fill', fill);
  };
  const mid = lw / 2;

  // One group per line (journalism, code, product), each track listed once under it (rule 33).
  const lineRows: Row[] = lines.flatMap((ln) => [
    { key: `line-${ln.id}`, name: ln.name, w: BW, h: lw, draw: (svg: Svg) => track(svg, 0, BW, mid, ln.colour) },
    ...data.themes.filter((th) => th.line === ln.id).sort(byLetter).map((th) => ({
      key: th.id, theme: th.id, name: `${th.letter} ${th.short}`, w: 0, h: 0, draw: () => undefined,
    })),
  ]);
  const root = select(container);
  const key = root.selectAll<HTMLDivElement, null>('div.tm-key').data([null]).join('div').attr('class', 'tm-key');
  const groups = key.selectAll<HTMLDivElement, { heading: string; rows: Row[] }>('div.tm-key-group')
    // The Symbols group lives in the map's bottom-left corner now (symbols-legend.ts, rule 34).
    .data([{ heading: 'Lines', rows: lineRows }], (g) => g.heading).join('div')
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
    // Only keyboard focus (:focus-visible) drives the highlight; a mouse click
    // focuses the row too, but leaving it then clears like a plain hover-leave.
    .on('focus', function (_e, r) { if (r.theme && this.matches(':focus-visible')) focusIn(r.theme); })
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
