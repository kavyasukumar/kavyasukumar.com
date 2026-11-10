// Station label text layout (rules 29-31): wrapping and placement beside a point.

export const LABEL_PX = 12;
export const CHAR_W = 0.6 * LABEL_PX;
export const LINE_H = 15;

export type ScreenDir = 'up' | 'down' | 'left' | 'right';

export function wrap(text: string, budget: number): string[] {
  if (text.length * CHAR_W <= budget) return [text];
  const words = text.split(' ');
  if (words.length < 2) return [text];
  let best = [text];
  let bestW = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const m = Math.max(a.length, b.length) * CHAR_W;
    if (m < bestW) { bestW = m; best = [a, b]; }
  }
  return best;
}

export interface Placed { x: number; y: number; anchor: string; box: [number, number, number, number] }

/**
 * Place `lines` beyond the point (ex, ey) in screen direction `dir`, `gap` px away.
 * Up/down labels are centred on ex; left/right labels are vertically centred on ey.
 * Returns the first baseline, the text anchor and the label's box for canvas sizing.
 */
export function placeLabel(dir: ScreenDir, ex: number, ey: number, gap: number, lines: string[]): Placed {
  const n = lines.length;
  const w = Math.max(...lines.map((l) => l.length * CHAR_W));
  if (dir === 'up' || dir === 'down') {
    const y = dir === 'up' ? ey - gap - (n - 1) * LINE_H - 3 : ey + gap + 10;
    return { x: ex, y, anchor: 'middle', box: [ex - w / 2, y - 10, ex + w / 2, y + (n - 1) * LINE_H + 3] };
  }
  const y = ey - ((n - 1) * LINE_H) / 2 + 4;
  const x = dir === 'left' ? ex - gap : ex + gap;
  return { x, y, anchor: dir === 'left' ? 'end' : 'start', box: [dir === 'left' ? x - w : x, y - 10, dir === 'left' ? x : x + w, y + (n - 1) * LINE_H + 3] };
}
