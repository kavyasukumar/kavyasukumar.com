// Names the highlighted track (rule 41). One bar fixed to the top of the
// viewport (.tm-trackbar-bar in dataviz.html) shows the line, number, short name
// and description while a track is highlighted, whatever the scroll position.
// Hidden and emptied when nothing is highlighted. Driven by the `tm:highlight`
// event from highlight.ts.
// Move aside: if at the top the bar would cover the pointer (or tapped point),
// the highlighted track near it, or the focused key row, it sits at the bottom
// of the viewport instead. Decided when the highlight starts and re-checked on
// rAF-throttled pointermove/scroll while visible.
import type { MapData } from './types';

const FADE_MS = 150;
const GAP = 8; // clearance kept between the bar (with its shadow) and the target
const NEAR_X = 160; // half-size of the window around the pointer that clips track boxes
const NEAR_Y = 48;
const PT = 12; // half-size of the box treated as the pointer itself

type Box = { l: number; t: number; r: number; b: number };
const hits = (a: Box, b: Box): boolean => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;
const toBox = (r: DOMRect): Box => ({ l: r.left, t: r.top, r: r.right, b: r.bottom });

export function initTrackbar(mapEl: HTMLElement, data: MapData): void {
  document.getElementById('transit-trackbar')?.remove();
  const bar = document.createElement('div');
  bar.id = 'transit-trackbar';
  bar.className = 'tm-trackbar tm-trackbar-bar';
  bar.setAttribute('aria-live', 'polite');
  bar.setAttribute('aria-atomic', 'true');
  document.body.appendChild(bar);

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let clearTimer = 0;
  let sideTimer = 0;
  let raf = 0;
  // Last pointer point. A touch tap is kept in page coordinates (it moves with
  // the page); a mouse in viewport coordinates (the page scrolls under it).
  let pt: { x: number; y: number; touch: boolean } | null = null;
  document.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch') pt = { x: e.clientX, y: e.clientY, touch: false }; }, { passive: true, capture: true });
  document.addEventListener('pointerdown', (e) => {
    pt = e.pointerType === 'touch' ? { x: e.clientX + scrollX, y: e.clientY + scrollY, touch: true } : { x: e.clientX, y: e.clientY, touch: false };
  }, { passive: true, capture: true });

  // What the bar must not cover, in viewport coordinates.
  const targets = (): Box[] => {
    const out: Box[] = [];
    if (pt) {
      const x = pt.touch ? pt.x - scrollX : pt.x;
      const y = pt.touch ? pt.y - scrollY : pt.y;
      out.push({ l: x - PT, t: y - PT, r: x + PT, b: y + PT });
      const near: Box = { l: x - NEAR_X, t: y - NEAR_Y, r: x + NEAR_X, b: y + NEAR_Y };
      mapEl.querySelectorAll('.tm-track.is-hl').forEach((el) => {
        const r = toBox(el.getBoundingClientRect());
        if (!hits(r, near)) return;
        out.push({ l: Math.max(r.l, near.l), t: Math.max(r.t, near.t), r: Math.min(r.r, near.r), b: Math.min(r.b, near.b) });
      });
    }
    const f = document.activeElement;
    if (f instanceof Element && f.matches('#transit-key [data-themes]')) out.push(toBox(f.getBoundingClientRect()));
    return out;
  };

  // Would the bar, placed at the top, cover any target?
  const wantBottom = (): boolean => {
    const r = bar.getBoundingClientRect();
    const top: Box = { l: r.left - GAP, t: 16 - GAP, r: r.right + 4 + GAP, b: 16 + bar.offsetHeight + 4 + GAP };
    return targets().some((t) => hits(top, t));
  };

  const place = (): void => {
    raf = 0;
    if (!bar.classList.contains('is-on') || sideTimer) return;
    const bottom = wantBottom();
    if (bottom === bar.classList.contains('is-bottom')) return;
    if (reduced.matches) { bar.classList.toggle('is-bottom', bottom); return; }
    // Fade out, switch side, fade back in.
    bar.classList.remove('is-on');
    sideTimer = window.setTimeout(() => {
      sideTimer = 0;
      if (bar.childElementCount === 0) return;
      bar.classList.toggle('is-bottom', bottom);
      bar.classList.add('is-on');
    }, FADE_MS);
  };
  const schedule = (): void => { if (!raf) raf = requestAnimationFrame(place); };
  window.addEventListener('pointermove', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });

  const fill = (themeId: string): boolean => {
    const th = data.themes.find((t) => t.id === themeId);
    if (!th) return false;
    const line = data.lines.find((l) => l.id === th.line);
    bar.textContent = '';
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
    bar.appendChild(head);
    if (th.theme) {
      const d = document.createElement('p');
      d.className = 'tb-desc';
      d.textContent = th.theme;
      bar.appendChild(d);
    }
    return true;
  };

  const show = (id: string | null): void => {
    window.clearTimeout(clearTimer);
    const wasOn = bar.classList.contains('is-on') || sideTimer !== 0;
    window.clearTimeout(sideTimer);
    sideTimer = 0;
    if (id !== null && fill(id)) {
      if (!wasOn) bar.classList.toggle('is-bottom', wantBottom());
      bar.classList.add('is-on');
      if (wasOn) schedule();
      return;
    }
    bar.classList.remove('is-on');
    // Empty the bar once the fade-out has finished, so it is empty while idle.
    if (reduced.matches) bar.textContent = '';
    else clearTimer = window.setTimeout(() => { bar.textContent = ''; }, FADE_MS);
  };

  mapEl.addEventListener('tm:highlight', (e) => show((e as CustomEvent<string | null>).detail));
}
