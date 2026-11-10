// Names the highlighted track (rule 41). Fills the strip that sits above the map
// frame (#transit-trackbar in dataviz.html): an idle hint when nothing is
// highlighted, else the line, number, short name and description. When the strip
// is scrolled above the viewport, a toast fixed to the top of the viewport shows
// the same content. Driven by the `tm:highlight` event from highlight.ts.
import type { MapData } from './types';

function layer(cls: string): HTMLElement {
  const el = document.createElement('div');
  el.className = `tm-trackbar ${cls}`;
  return el;
}

export function initTrackbar(mapEl: HTMLElement, data: MapData): void {
  let found = document.getElementById('transit-trackbar');
  if (!found) {
    found = document.createElement('div');
    found.id = 'transit-trackbar';
    found.className = 'tm-strip';
    mapEl.before(found);
  }
  const strip: HTMLElement = found;
  strip.setAttribute('aria-live', 'polite');
  strip.setAttribute('aria-atomic', 'true');
  strip.textContent = '';

  const idle = layer('tm-trackbar-idle is-on');
  const live = layer('tm-trackbar-strip');
  strip.append(idle, live);
  const toast = layer('tm-trackbar-toast');
  toast.setAttribute('aria-hidden', 'true');
  document.body.appendChild(toast);

  const hover = window.matchMedia('(hover: hover)');
  const setHint = (): void => { idle.textContent = hover.matches ? 'Hover a track' : 'Tap a track'; };
  setHint();
  hover.addEventListener('change', setHint);

  let current: string | null = null;

  const fill = (el: HTMLElement, themeId: string): boolean => {
    const th = data.themes.find((t) => t.id === themeId);
    if (!th) return false;
    const line = data.lines.find((l) => l.id === th.line);
    el.textContent = '';
    const head = document.createElement('div');
    head.className = 'tb-head';
    const name = document.createElement('span');
    name.className = 'tb-line';
    name.textContent = line?.name ?? th.line;
    const num = document.createElement('span');
    num.className = 'tb-num';
    num.textContent = String(th.num);
    const short = document.createElement('span');
    short.className = 'tb-short';
    short.textContent = th.short;
    head.append(name, num, short);
    el.appendChild(head);
    if (th.theme) {
      const d = document.createElement('p');
      d.className = 'tb-desc';
      d.textContent = th.theme;
      el.appendChild(d);
    }
    return true;
  };

  // The toast stands in for the strip once the strip's top edge leaves the viewport.
  const place = (): void => {
    const inView = strip.getBoundingClientRect().top >= 0;
    toast.classList.toggle('is-on', current !== null && !inView);
  };

  const show = (id: string | null): void => {
    current = id !== null && fill(live, id) && fill(toast, id) ? id : null;
    live.classList.toggle('is-on', current !== null);
    idle.classList.toggle('is-on', current === null);
    place();
  };

  mapEl.addEventListener('tm:highlight', (e) => show((e as CustomEvent<string | null>).detail));
  window.addEventListener('scroll', place, { passive: true });
}
