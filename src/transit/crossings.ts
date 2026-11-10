// Crossings between tracks of one line (rules 8, 18, 19). The straight-through
// track stays on top; under it, a background-colour casing about 0.25 lw wide on
// each side cuts the crossing track.

import { toXY } from './geometry';
import type { LineLayout, MapTrack, Scale } from './types';

export interface Casing { key: string; x1: number; y1: number; x2: number; y2: number }

type Pt = [number, number];

function intersect(a: Pt, b: Pt, c: Pt, d: Pt): Pt | null {
  const r: Pt = [b[0] - a[0], b[1] - a[1]];
  const s: Pt = [d[0] - c[0], d[1] - c[1]];
  const den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null; // parallel
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den;
  const u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  if (t <= 0.001 || t >= 0.999 || u <= 0.001 || u >= 0.999) return null;
  return [a[0] + t * r[0], a[1] + t * r[1]];
}

/** Casing segments along each top track wherever a track of another theme crosses it. */
export function casings(tracks: MapTrack[], layout: LineLayout, s: Scale): Casing[] {
  const pts = (id: string): Pt[] => layout.tracks[id]!.route.map((p) => toXY(p.slot, p.lane, s));
  const out: Casing[] = [];
  const tops = tracks.filter((t) => layout.tracks[t.id]?.top);
  const unders = tracks.filter((t) => !layout.tracks[t.id]?.top);
  for (const top of tops) {
    const tp = pts(top.id);
    for (const under of unders) {
      if (under.theme === top.theme) continue; // branches of one track never cross (rule 5)
      const up = pts(under.id);
      for (let i = 0; i < tp.length - 1; i++) {
        for (let j = 0; j < up.length - 1; j++) {
          const a = tp[i]!; const b = tp[i + 1]!;
          const x = intersect(a, b, up[j]!, up[j + 1]!);
          if (!x) continue;
          const tl = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const td: Pt = [(b[0] - a[0]) / tl, (b[1] - a[1]) / tl];
          const c = up[j + 1]!; const d = up[j]!;
          const ul = Math.hypot(c[0] - d[0], c[1] - d[1]);
          const sin = Math.abs(td[0] * (c[1] - d[1]) - td[1] * (c[0] - d[0])) / ul;
          // Cover the crossing track's width plus its casing, measured along the top track.
          // On the side the crossing track comes from, reach back over its split arc too, so
          // its edge never fills the hairline between the trunks it leaves and crosses.
          const half = ((0.5 + 0.25) * s.lw) / Math.max(sin, 0.3);
          const from = (d[0] - x[0]) * td[0] + (d[1] - x[1]) * td[1] < 0 ? -1 : 1;
          const back = half + 0.65 * s.lw;
          const fwd = half - 0.22 * s.lw;
          const a1 = from < 0 ? -back : -fwd;
          const a2 = from < 0 ? fwd : back;
          out.push({
            key: `${top.id}|${under.id}|${i}|${j}`,
            x1: x[0] + td[0] * a1, y1: x[1] + td[1] * a1, x2: x[0] + td[0] * a2, y2: x[1] + td[1] * a2,
          });
        }
      }
    }
  }
  return out;
}
