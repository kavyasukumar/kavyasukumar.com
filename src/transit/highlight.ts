// Theme highlight (rule 41). Mouse hover on a track or key row, keyboard focus
// on a key row, or a touch tap on a track highlights every track of that theme.
// State lives here; the DOM gets classes (`has-hl` on the svg / key, `is-hl` on
// matching elements) and CSS does the greying. One map per page.

let hover: string | null = null;
let focus: string | null = null;
let pinned: string | null = null;
let mapEl: HTMLElement | null = null;
let keyEl: HTMLElement | null = null;
let docBound = false;
let announced: string | null = null;
let announcedSrc: HighlightSource = null;

const active = (): string | null => hover ?? focus ?? pinned;

/** What drives the active highlight: a mouse/pen hover, key-row focus, or a touch tap. */
export type HighlightSource = 'hover' | 'focus' | 'pinned' | null;
export const highlightSource = (): HighlightSource =>
  hover !== null ? 'hover' : focus !== null ? 'focus' : pinned !== null ? 'pinned' : null;

function apply(): void {
  const t = active();
  const mark = (root: HTMLElement | null, host: Element | null): void => {
    if (!root || !host) return;
    host.classList.toggle('has-hl', t !== null);
    root.querySelectorAll<Element>('[data-themes]').forEach((el) => {
      const list = (el.getAttribute('data-themes') ?? '').split(' ');
      el.classList.toggle('is-hl', t !== null && list.includes(t));
    });
  };
  mark(mapEl, mapEl?.querySelector('svg.tm-svg') ?? null);
  mark(keyEl, keyEl?.querySelector('div.tm-key') ?? null);
  if (mapEl) {
    if (t) mapEl.dataset.highlight = t;
    else delete mapEl.dataset.highlight;
    // Tell listeners (the track bar) when the highlighted theme, or what drives
    // it, changes. `detail` is the theme; read the source with highlightSource().
    const src = highlightSource();
    if (t !== announced || src !== announcedSrc) {
      announced = t;
      announcedSrc = src;
      mapEl.dispatchEvent(new CustomEvent('tm:highlight', { detail: t }));
    }
  }
}

const isTouch = (e: PointerEvent): boolean => e.pointerType === 'touch';

/** Mouse/pen hover in; touch is handled by `tapTrack`. */
export function hoverIn(e: PointerEvent, theme: string): void {
  if (isTouch(e)) return;
  hover = theme;
  apply();
}
export function hoverOut(e: PointerEvent): void {
  if (isTouch(e)) return;
  hover = null;
  apply();
}
export function focusIn(theme: string): void { focus = theme; apply(); }
export function focusOut(): void { focus = null; apply(); }

/** Touch tap on a track toggles its theme. Mouse clicks on tracks do nothing. */
export function tapTrack(e: PointerEvent, theme: string): void {
  if (!isTouch(e)) return;
  pinned = pinned === theme ? null : theme;
  apply();
}

function bindDocument(): void {
  if (docBound) return;
  docBound = true;
  // A touch tap anywhere that is not a track clears a pinned highlight.
  document.addEventListener('pointerup', (e) => {
    if (!isTouch(e) || pinned === null) return;
    const target = e.target as Element | null;
    if (target?.closest?.('.tm-track')) return;
    pinned = null;
    apply();
  });
}

/** Call after every map render (idempotent; keeps an active highlight across resize). */
export function registerMap(container: HTMLElement): void {
  mapEl = container;
  bindDocument();
  apply();
}
/** Call after every key render. */
export function registerKey(container: HTMLElement): void {
  keyEl = container;
  apply();
}
