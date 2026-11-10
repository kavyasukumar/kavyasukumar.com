// Names the highlighted track (rule 41). Shows an inline bar inside the top edge
// of the map frame when that edge is on screen, else a toast fixed to the top of
// the viewport. Driven by the `tm:highlight` event from highlight.ts.
import type { MapData } from './types';

export function initTrackbar(mapEl: HTMLElement, data: MapData): void {
  const live = document.createElement('div');
  live.className = 'tm-trackbar tm-trackbar-inline';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');
  const toast = document.createElement('div');
  toast.className = 'tm-trackbar tm-trackbar-toast';
  toast.setAttribute('aria-hidden', 'true');
  mapEl.appendChild(live);
  document.body.appendChild(toast);

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

  const place = (): void => {
    if (current === null) return;
    const inView = mapEl.getBoundingClientRect().top >= 0;
    live.classList.toggle('is-on', inView);
    toast.classList.toggle('is-on', !inView);
  };

  const show = (id: string | null): void => {
    current = id;
    if (id === null || !fill(live, id) || !fill(toast, id)) {
      current = null;
      live.classList.remove('is-on');
      toast.classList.remove('is-on');
      return;
    }
    place();
  };

  mapEl.addEventListener('tm:highlight', (e) => show((e as CustomEvent<string | null>).detail));
  window.addEventListener('scroll', place, { passive: true });
}
