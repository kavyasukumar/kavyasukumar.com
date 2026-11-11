import { select, type Selection } from 'd3-selection';
import { focusIn, focusOut, hoverIn, hoverOut, pinTo, registerKey, setGroups, tapTrack, unpinIf } from './highlight';
import { isOpen, setPanel, togglePanel } from './key-accordion';
import { TRACK_LETTERS, type LineLayout, type MapData, type MapLine, type MapTheme } from './types';

type Svg = Selection<SVGSVGElement, unknown, null, undefined>;
type Track = { theme: string; name: string };
type Group = { id: string; hl: string; name: string; colour: string; tracks: Track[] };

/** Ribbon order: by track letter (A at the top). */
const byLetter = (a: MapTheme, b: MapTheme): number => TRACK_LETTERS.indexOf(a.letter) - TRACK_LETTERS.indexOf(b.letter);

let headTouch = false; // the last pointerdown on a line header was a touch

/** Hover and keyboard focus on a key row highlight `id` (rule 41): a theme, or a `line:` group. */
function wire<E extends HTMLElement, D, P extends Element>(sel: Selection<E, D, P, unknown>, id: (d: D) => string): void {
  sel.on('pointerenter', (e: Event, d) => hoverIn(e as PointerEvent, id(d)))
    .on('pointerleave', (e: Event) => hoverOut(e as PointerEvent))
    // Only keyboard focus (:focus-visible) drives the highlight; a mouse click
    // focuses the row too, but leaving it then clears like a plain hover-leave.
    .on('focus', function (_e, d) { if (this.matches(':focus-visible')) focusIn(id(d)); })
    .on('blur', () => focusOut());
}

/** Render the key into `container` at the current map lw (rules 32-34, 36, 38). Idempotent. */
export function renderKey(container: HTMLElement, data: MapData, layout: LineLayout, lw: number): void {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) return;
  const lines = (layout.lineIds ?? [line.id]).map((id) => data.lines.find((l) => l.id === id)).filter((l): l is MapLine => !!l);

  // Line swatches are drawn as the map draws tracks (rule 34): solid, 1 lw wide.
  // Every swatch is this wide so names line up (rule 36).
  const BW = 5 * lw;
  // One accordion section per line, in ribbon order, each track listed once under it (rule 33).
  const model: Group[] = lines.map((ln) => ({
    id: ln.id, hl: `line:${ln.id}`, name: ln.name, colour: ln.colour,
    tracks: data.themes.filter((th) => th.line === ln.id).sort(byLetter).map((th) => ({ theme: th.id, name: `${th.letter} ${th.short}` })),
  }));
  // A line header highlights all of its line's tracks.
  setGroups(Object.fromEntries(model.map((g) => [g.hl, g.tracks.map((t) => t.theme)])));

  // Track rows indent by swatch + gap so their names start under the line name (CSS reads --tm-key-sw).
  const key = select(container).selectAll<HTMLDivElement, null>('div.tm-key').data([null]).join('div').attr('class', 'tm-key')
    .style('--tm-key-sw', `${BW}px`);
  // The Symbols group lives in the map's bottom-left corner now (symbols-legend.ts, rule 34).
  const group = key.selectAll<HTMLDivElement, null>('div.tm-key-group').data([null]).join('div').attr('class', 'tm-key-group');
  group.selectAll('h3.tm-key-heading').data([null]).join('h3').attr('class', 'tm-key-heading').text('Lines');
  const sections = group.selectAll<HTMLDivElement, Group>('div.tm-key-line').data(model, (g) => g.id).join('div')
    .attr('class', 'tm-key-line');

  const heads = sections.selectAll<HTMLHeadingElement, Group>('h4.tm-key-h').data((g) => [g]).join('h4').attr('class', 'tm-key-h')
    .selectAll<HTMLButtonElement, Group>('button.tm-key-head').data((g) => [g]).join('button')
    .attr('class', 'tm-key-row tm-key-head').attr('type', 'button')
    .attr('id', (g) => `tm-key-h-${g.id}`).attr('aria-controls', (g) => `tm-key-p-${g.id}`)
    .attr('data-themes', (g) => g.hl)
    // Touch: a header tap also pins its line while open; closing clears that line's
    // pin only (rule 41). The pointer type is noted on pointerdown because the click that
    // follows is not a PointerEvent in every browser; Enter/Space clicks skip it.
    .on('pointerdown', (e: PointerEvent) => { headTouch = e.pointerType === 'touch'; })
    .on('click', function (e: MouseEvent, g) {
      const touch = headTouch && e.detail > 0;
      headTouch = false;
      const panel = document.getElementById(`tm-key-p-${g.id}`);
      if (!panel) return;
      togglePanel(g.id, this, panel);
      // Closing clears only this line's pin (its line:<id> or one of its tracks); another line's pin stays.
      if (touch) { if (isOpen(g.id)) pinTo(g.hl); else unpinIf([g.hl, ...g.tracks.map((t) => t.theme)]); }
    });
  wire(heads, (g) => g.hl);
  const swatches = heads.selectAll<HTMLSpanElement, Group>('span.tm-key-swatch').data((g) => [g]).join('span')
    .attr('class', 'tm-key-swatch').style('display', 'inline-flex').style('align-items', 'center')
    .style('width', `${BW}px`).style('height', `${lw}px`);
  swatches.each(function (g) {
    const sel = select(this);
    sel.selectAll('svg').remove();
    const svg = sel.append('svg').attr('width', BW).attr('height', lw).attr('viewBox', `0 0 ${BW} ${lw}`)
      .attr('aria-hidden', 'true').style('display', 'block').style('overflow', 'hidden') as Svg;
    svg.append('rect').attr('class', 'tm-key-track').attr('x', 0).attr('y', 0)
      .attr('width', BW).attr('height', lw).attr('fill', g.colour);
  });
  heads.selectAll<HTMLSpanElement, Group>('span.tm-key-name').data((g) => [g]).join('span')
    .attr('class', 'tm-key-name').text((g) => g.name);
  heads.selectAll('span.tm-key-ind').data([null]).join('span').attr('class', 'tm-key-ind').attr('aria-hidden', 'true');

  const panels = sections.selectAll<HTMLDivElement, Group>('div.tm-key-tracks').data((g) => [g]).join('div')
    .attr('class', 'tm-key-tracks').attr('id', (g) => `tm-key-p-${g.id}`)
    .attr('role', 'group').attr('aria-labelledby', (g) => `tm-key-h-${g.id}`);
  const rows = panels.selectAll<HTMLDivElement, Track>('div.tm-key-row').data((g) => g.tracks, (t) => t.theme).join('div')
    .attr('class', 'tm-key-row').attr('data-themes', (t) => t.theme).attr('tabindex', 0);
  wire(rows, (t) => t.theme);
  // Touch: a tap on a track row toggles its theme, as a tap on the map's track does.
  rows.on('pointerup', (e: PointerEvent, t) => tapTrack(e, t.theme));
  rows.selectAll<HTMLSpanElement, Track>('span.tm-key-name').data((t) => [t]).join('span')
    .attr('class', 'tm-key-name').text((t) => t.name);

  // Sync each section to its stored state (all closed on first render).
  sections.each(function (g) {
    const btn = this.querySelector<HTMLElement>('button.tm-key-head');
    const panel = this.querySelector<HTMLElement>('div.tm-key-tracks');
    if (btn && panel && btn.getAttribute('aria-expanded') !== String(isOpen(g.id))) setPanel(btn, panel, isOpen(g.id), false);
  });
  registerKey(container);
}
