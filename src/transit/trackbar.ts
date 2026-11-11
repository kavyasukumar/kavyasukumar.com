// Names the highlighted track (rule 41), or for a key line header the line and
// its tracks (a `line:<id>` highlight, rule 33). One panel (#transit-trackbar) shows the
// line, number, short name and description while a track is highlighted, in one
// of two modes, driven by the `tm:highlight` event and highlightSource() from
// highlight.ts:
// - Tooltip (.tm-trackbar-tip): a mouse/pen hover on a track or key row. Sits
//   16px right of and below the pointer and follows it (rAF-throttled); flips
//   left and/or above when it would leave the viewport (trackbar-tip.ts).
// - Bar (.tm-trackbar-bar): a touch tap or key-row focus, where there is no
//   pointer to follow. Fixed to the top of the viewport. Move aside: if at the
//   top it would cover the tapped point, the highlighted track near it, or the
//   focused key row, it sits at the bottom instead. Decided when the highlight
//   starts and re-checked on rAF-throttled pointermove/scroll while visible.
// It is one aria-live region in both modes, refilled only when the theme
// changes, so a change of mode or a pointer move announces nothing new.
// Hidden and emptied when nothing is highlighted.
import { highlightSource } from './highlight';
import { tipPos } from './trackbar-tip';
import type { MapData } from './types';

const FADE_MS = 150;
const GAP = 8; // clearance kept between the bar (with its shadow) and the target
const NEAR_X = 160; // half-size of the window around the pointer that clips track boxes
const NEAR_Y = 48;
const PT = 12; // half-size of the box treated as the pointer itself
const SHADOW = 4; // hard offset shadow, part of the tooltip's footprint

type Box = { l: number; t: number; r: number; b: number };
type Mode = 'tip' | 'bar';
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
  let mode: Mode = 'bar';
  let shown: string | null = null; // theme the panel holds
  let size = { w: 0, h: 0 }; // tooltip footprint, measured when shown
  // Last pointer point. A touch tap is kept in page coordinates (it moves with
  // the page); a mouse in viewport coordinates (the page scrolls under it).
  let pt: { x: number; y: number; touch: boolean } | null = null;
  const track = (e: PointerEvent): void => { if (e.pointerType !== 'touch') pt = { x: e.clientX, y: e.clientY, touch: false }; };
  // pointerover runs before the pointerenter that starts a hover, so the
  // tooltip has the entry point on its first frame.
  document.addEventListener('pointerover', track, { passive: true, capture: true });
  document.addEventListener('pointermove', track, { passive: true, capture: true });
  document.addEventListener('pointerdown', (e) => {
    pt = e.pointerType === 'touch' ? { x: e.clientX + scrollX, y: e.clientY + scrollY, touch: true } : { x: e.clientX, y: e.clientY, touch: false };
  }, { passive: true, capture: true });

  const isOn = (): boolean => bar.classList.contains('is-on');

  // Switch mode without animating the jump between the two positions.
  const setMode = (m: Mode): void => {
    if (m === mode) return;
    mode = m;
    bar.style.transition = 'none';
    bar.classList.toggle('tm-trackbar-tip', m === 'tip');
    bar.classList.toggle('tm-trackbar-bar', m === 'bar');
    if (m === 'bar') bar.style.transform = '';
    bar.classList.remove('is-bottom');
    void bar.offsetWidth;
    bar.style.transition = '';
  };

  const moveTip = (): void => {
    if (!pt || pt.touch) return;
    const p = tipPos(pt.x, pt.y, size.w, size.h, innerWidth, innerHeight);
    bar.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;
  };

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
    const top: Box = { l: r.left - GAP, t: 16 - GAP, r: r.right + SHADOW + GAP, b: 16 + bar.offsetHeight + SHADOW + GAP };
    return targets().some((t) => hits(top, t));
  };

  const place = (): void => {
    raf = 0;
    if (!isOn()) return;
    if (mode === 'tip') { moveTip(); return; }
    if (sideTimer) return;
    const bottom = wantBottom();
    if (bottom === bar.classList.contains('is-bottom')) return;
    if (reduced.matches) { bar.classList.toggle('is-bottom', bottom); return; }
    // Fade out, switch side, fade back in.
    bar.classList.remove('is-on');
    sideTimer = window.setTimeout(() => {
      sideTimer = 0;
      if (bar.childElementCount === 0 || mode !== 'bar') return;
      bar.classList.toggle('is-bottom', bottom);
      bar.classList.add('is-on');
    }, FADE_MS);
  };
  const schedule = (): void => { if (!raf) raf = requestAnimationFrame(place); };
  window.addEventListener('pointermove', schedule, { passive: true });
  window.addEventListener('scroll', schedule, { passive: true });

  const el = (tag: string, cls: string, text: string): HTMLElement => {
    const e = document.createElement(tag);
    e.className = cls;
    e.textContent = text;
    return e;
  };
  // A key line header (`line:<id>`) names the line and lists its tracks.
  const fillLine = (lineId: string): boolean => {
    const line = data.lines.find((l) => l.id === lineId);
    if (!line) return false;
    const ths = data.themes.filter((t) => t.line === lineId);
    const head = el('div', 'tb-head', '');
    head.append(el('span', 'tb-line', line.name), el('span', 'tb-short', `${ths.length} tracks`));
    bar.append(head, el('p', 'tb-desc', ths.map((t) => `${t.letter} ${t.short}`).sort().join(' \u00b7 ')));
    return true;
  };
  const fill = (themeId: string): boolean => {
    bar.textContent = '';
    if (themeId.startsWith('line:')) return fillLine(themeId.slice(5));
    const th = data.themes.find((t) => t.id === themeId);
    if (!th) return false;
    const line = data.lines.find((l) => l.id === th.line);
    const head = el('div', 'tb-head', '');
    head.append(el('span', 'tb-line', line?.name ?? th.line), el('span', 'tb-id', th.letter), el('span', 'tb-short', th.short));
    bar.appendChild(head);
    if (th.theme) bar.appendChild(el('p', 'tb-desc', th.theme));
    return true;
  };

  const show = (id: string | null): void => {
    window.clearTimeout(clearTimer);
    const wasOn = isOn() || sideTimer !== 0;
    window.clearTimeout(sideTimer);
    sideTimer = 0;
    if (id === null) {
      bar.classList.remove('is-on');
      // Empty the panel once the fade-out has finished, so it is empty while idle.
      // It keeps its mode, position and content while it fades, so a highlight
      // that ends and restarts on the same theme in one go (the pointer crossing
      // from one of its tracks to another) is not refilled or announced again.
      clearTimer = window.setTimeout(() => { bar.textContent = ''; shown = null; }, reduced.matches ? 0 : FADE_MS);
      return;
    }
    // A mouse/pen hover with a known pointer gets the tooltip; touch and focus the bar.
    const next: Mode = highlightSource() === 'hover' && pt !== null && !pt.touch ? 'tip' : 'bar';
    const modeChanged = next !== mode;
    setMode(next);
    // Refill (and so announce) only when the theme changes.
    if (id !== shown) {
      if (!fill(id)) { shown = null; bar.classList.remove('is-on'); bar.textContent = ''; return; }
      shown = id;
    }
    if (mode === 'tip') {
      size = { w: bar.offsetWidth + SHADOW, h: bar.offsetHeight + SHADOW };
      moveTip();
    } else if (!wasOn || modeChanged) bar.classList.toggle('is-bottom', wantBottom());
    bar.classList.add('is-on');
    if (wasOn && mode === 'bar' && !modeChanged) schedule();
  };

  mapEl.addEventListener('tm:highlight', (e) => show((e as CustomEvent<string | null>).detail));
}
