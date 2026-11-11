import rawData from '../../data/transit-map-data.json';
import { renderKey } from './key';
import { careerLayout } from './layout-code';
import { yearsOf } from './model';
import { renderMap, type RenderResult } from './render';
import { initScrollHint } from './scroll-hint';
import { renderSymbolsBelow } from './symbols-legend';
import { initTrackbar } from './trackbar';
import type { MapData } from './types';

const data = rawData as unknown as MapData;
const mapEl = document.getElementById('transit-map');
const keyEl = document.getElementById('transit-key');
const kindEl = document.getElementById('ck');
const nameEl = document.getElementById('ch');
const infoEl = document.getElementById('cp');
const hintEl = document.getElementById('transit-map-hint');
const symbolsEl = document.getElementById('transit-symbols');

let last: RenderResult | null = null;
let lastWidth = -1;
let lastKeyLw = -1;
let updateHint: (() => void) | null = null;

function draw(el: HTMLElement): void {
  last = renderMap(el, data, careerLayout);
  lastWidth = el.clientWidth;
  if (keyEl) {
    const lw = Math.round(last.scale.lw * 100) / 100;
    if (lw !== lastKeyLw) { renderKey(keyEl, data, careerLayout, last.scale.lw); lastKeyLw = lw; }
  }
  // Phone: the symbols legend goes below the frame when the canvas has no room for it (rule 34).
  if (symbolsEl) renderSymbolsBelow(symbolsEl, last.symbolsInMap ? null : last.scale.lw);
  updateHint?.(); // a re-render changes scrollWidth
}

function showPrompt(): void {
  if (kindEl) kindEl.textContent = '';
  if (nameEl) nameEl.textContent = 'Tap a station.';
  if (infoEl) infoEl.textContent = '';
}

function showStation(id: string): void {
  const sm = last?.model.stations.find((s) => s.st.id === id);
  if (!sm) return;
  const kind = sm.kind === 'interchange' ? 'Interchange' : sm.kind === 'terminal' ? 'Terminal' : 'Station';
  if (kindEl) kindEl.textContent = sm.st.part_time ? `${kind}, part-time` : kind;
  if (nameEl) nameEl.textContent = sm.st.name;
  if (infoEl) infoEl.textContent = `${yearsOf(sm.st)} · ${sm.themes.join(', ')}`;
}

function clearStation(): void {
  if (!mapEl || !mapEl.dataset.selected) return;
  delete mapEl.dataset.selected;
  mapEl.querySelectorAll('g.tm-station.is-selected').forEach((g) => g.classList.remove('is-selected'));
  showPrompt();
}

if (mapEl) {
  showPrompt();
  draw(mapEl);
  if (hintEl) updateHint = initScrollHint(mapEl, hintEl);
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t instanceof Element && (t.closest('.tm-station') || t.closest('.card'))) return;
    clearStation();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') clearStation();
  });
  initTrackbar(mapEl, data);
  mapEl.addEventListener('tm:select', (e) => showStation((e as CustomEvent<string>).detail));
  let frame = 0;
  new ResizeObserver(() => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      if (mapEl.clientWidth !== lastWidth) draw(mapEl);
    });
  }).observe(mapEl);
}
