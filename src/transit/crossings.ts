// Crossings between tracks of one line (rules 8, 18, 19). The straight-through
// track stays on top; under it, a background-colour casing about 0.25 lw wide on
// each side cuts the crossing track.

import { PITCH, toXY } from './geometry';
import type { LineLayout, MapTrack, Scale } from './types';

/** `under` set: a crossing casing, drawn only where it overlaps that track. Empty: a hairline (rule 10). */
export interface Casing { key: string; under: string; w: number; x1: number; y1: number; x2: number; y2: number }

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
          // Cover the crossing track's footprint plus its casing, measured along the top track.
          // The renderer masks the casing to the crossing track, so a generous length never
          // cuts a neighbour or the hairline between parallel tracks.
          const cos = Math.sqrt(1 - Math.min(sin, 0.99) ** 2);
          const half = (0.5 * s.lw) / Math.max(sin, 0.3) + (0.75 * s.lw * cos) / Math.max(sin, 0.3);
          const a1 = -half;
          const a2 = half;
          out.push({
            key: `${top.id}|${under.id}|${i}|${j}`, under: under.id, w: 1.5 * s.lw,
            x1: x[0] + td[0] * a1, y1: x[1] + td[1] * a1, x2: x[0] + td[0] * a2, y2: x[1] + td[1] * a2,
          });
        }
      }
    }
  }
  return out.concat(hairlines(tops, pts, s));
}

/**
 * One cream hairline (rule 10) down the middle of every gap between two straight-through
 * tracks that run parallel one pitch apart. Drawn over any branch passing beneath, so the
 * gap shows along the whole shared run or not at all.
 */
function hairlines(tops: MapTrack[], pts: (id: string) => Pt[], s: Scale): Casing[] {
  const out: Casing[] = [];
  for (let m = 0; m < tops.length; m++) {
    for (let n = m + 1; n < tops.length; n++) {
      const p = pts(tops[m]!.id); const q = pts(tops[n]!.id);
      for (let i = 0; i < p.length - 1; i++) {
        for (let j = 0; j < q.length - 1; j++) {
          const a = p[i]!; const b = p[i + 1]!; const c = q[j]!; const d = q[j + 1]!;
          const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
          const u: Pt = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
          const nrm: Pt = [-u[1], u[0]];
          const off = (c[0] - a[0]) * nrm[0] + (c[1] - a[1]) * nrm[1];
          const off2 = (d[0] - a[0]) * nrm[0] + (d[1] - a[1]) * nrm[1];
          if (Math.abs(off - off2) > 1e-6 || Math.abs(Math.abs(off) - PITCH * s.lw) > 0.05 * s.lw) continue;
          const along = (pt: Pt): number => (pt[0] - a[0]) * u[0] + (pt[1] - a[1]) * u[1];
          const lo = Math.max(0, Math.min(along(c), along(d)));
          const hi = Math.min(l, Math.max(along(c), along(d)));
          if (hi - lo < 1e-6) continue;
          const h = off / 2;
          out.push({
            key: `hair|${tops[m]!.id}|${tops[n]!.id}|${i}|${j}`, under: '', w: (PITCH - 1) * s.lw,
            x1: a[0] + u[0] * lo + nrm[0] * h, y1: a[1] + u[1] * lo + nrm[1] * h,
            x2: a[0] + u[0] * hi + nrm[0] * h, y2: a[1] + u[1] * hi + nrm[1] * h,
          });
        }
      }
    }
  }
  return out;
}
