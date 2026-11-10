import type { LineLayout, StationLayout, TrackLayout } from './types';

/** Slots follow career order only, evenly spaced (rule 28). No time axis (rule 39). */
const slots: Record<string, number> = {
  'medill': 0,
  'palm-beach-post': 1,
  'opennews-fellow': 2,
  'vox-media': 3,
  'bad-idea-factory': 4,
  'hearken': 5,
  'all-things-small': 6,
  'uw-lecturer': 7,
  'washington-post': 8,
  'lighthouse-reports': 9,
};

/** Part-time stations (all hatched) label below their tracks; full-time ones above. */
const below = new Set(['bad-idea-factory', 'all-things-small', 'uw-lecturer']);

const stations: Record<string, StationLayout> = {};
for (const [id, slot] of Object.entries(slots)) {
  stations[id] = { slot, labelSide: below.has(id) ? 'after' : 'before' };
}

const GAP = 8; // lw per slot, both orientations
const LW = 1 / GAP; // one lw in slot units
const P = 1.12; // track pitch (rule 10)
const R = 1.5; // inner bend radius (rule 14)

const RIDE = 3.36; // first lane under the full-time bundle (5a, 6a, 7a at 0, 1.12, 2.24)
const GIG = 10.2; // first lane of the gig stubs
const BIF = 20.5; // first lane of the Bad Idea Factory bundle

const straight = (from: number, to: number, lane: number): TrackLayout => ({
  route: [{ slot: from, lane }, { slot: to, lane }],
});

/**
 * Tracks that ride beside a bundle from `from`, peel off at `drop` with concentric
 * 90 degree bends (rules 14, 20), and run on at `toLane` to `to`. `dir` 1 = peel
 * down off the bundle above them, -1 = peel up off the bundle below them.
 */
function branch(ids: string[], from: number, drop: number, rideLane: number, toLane: number, to: number, dir: 1 | -1): Record<string, TrackLayout> {
  const n = ids.length;
  const out: Record<string, TrackLayout> = {};
  ids.forEach((id, k) => {
    const ride = dir === 1 ? rideLane + k * P : rideLane - (n - k) * P;
    const lane = toLane + k * P;
    const outer = dir === 1 ? n - 1 - k : k; // steps from the inside of the first bend
    const x = drop + outer * P * LW;
    out[id] = {
      route: [{ slot: from, lane: ride }, { slot: x, lane: ride }, { slot: x, lane }, { slot: to, lane }],
      radii: [R + outer * P, R + (n - 1 - outer) * P],
    };
  });
  return out;
}

const tracks: Record<string, TrackLayout> = {
  // Full-time bundle
  'journalism-finding-stories-1': straight(0, 8, 0),
  'journalism-storytelling-1': straight(0, 8, 1.12),
  'journalism-tooling-1': straight(1, 8, 2.24),
  // Bad Idea Factory (ongoing): peels off under the full-time bundle, runs along the bottom to the edge.
  ...branch(['journalism-finding-stories-2', 'journalism-storytelling-2', 'journalism-tooling-2'], 2.95, 3.34, RIDE, BIF, 9, 1),
  // Gigs never chain (rule 37); each peels off, stops at its station and ends there.
  ...branch(['journalism-storytelling-3', 'journalism-tooling-3'], 5.07, 5.45, RIDE, GIG, 6, 1),
  ...branch(['journalism-finding-stories-3', 'journalism-storytelling-4', 'journalism-tooling-4'], 5.965, 6.34, RIDE, GIG, 7, 1),
  // Lighthouse Reports comes after the full-time bundle ends, so it peels up off Bad Idea Factory.
  ...branch(['journalism-finding-stories-4', 'journalism-storytelling-5', 'journalism-tooling-5'], 7.875, 8.25, BIF, GIG, 9, -1),
};

export const journalismLayout: LineLayout = {
  lineId: 'journalism',
  slotGap: { horizontal: GAP, vertical: GAP },
  stations,
  tracks,
  discs: [], // No terminal discs (rule 26, owner decision)
};
