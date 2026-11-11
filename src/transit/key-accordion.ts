// Key accordion (rule 33): each line header is a <button aria-expanded
// aria-controls> that opens or closes the panel of its tracks. All closed on
// load; any number open at once. Open/closed state lives here so it survives
// the key re-rendering on resize. The panel's height animates (CSS, 180 ms);
// under reduced motion the change is instant. A closed panel is `inert` at once
// and `hidden` once it has collapsed, so its rows leave the tab order and the
// accessibility tree.

const MS = 180; // matches .tm-key-tracks' transition in dataviz.html
const open = new Set<string>();
const timers = new Map<HTMLElement, number>();
const reduced = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const isOpen = (id: string): boolean => open.has(id);

/** Set a header and its panel to `on` (animating when `animate` and motion is allowed). */
export function setPanel(btn: HTMLElement, panel: HTMLElement, on: boolean, animate: boolean): void {
  btn.setAttribute('aria-expanded', String(on));
  const ind = btn.querySelector('.tm-key-ind');
  if (ind) ind.textContent = on ? '−' : '+';
  window.clearTimeout(timers.get(panel));
  const settle = (): void => {
    panel.style.height = '';
    panel.hidden = !on;
  };
  if (on) panel.removeAttribute('inert');
  else panel.setAttribute('inert', '');
  if (!animate || reduced()) { settle(); return; }
  // From the current height (mid-animation or settled) to the target one.
  const from = panel.hidden ? 0 : panel.getBoundingClientRect().height;
  panel.hidden = false;
  panel.style.height = 'auto';
  const to = on ? panel.scrollHeight : 0;
  panel.style.height = `${from}px`;
  void panel.offsetHeight;
  panel.style.height = `${to}px`;
  timers.set(panel, window.setTimeout(settle, MS));
}

/** Toggle line `id`'s panel from its header button. */
export function togglePanel(id: string, btn: HTMLElement, panel: HTMLElement): void {
  const on = !open.has(id);
  if (on) open.add(id);
  else open.delete(id);
  setPanel(btn, panel, on, true);
}
