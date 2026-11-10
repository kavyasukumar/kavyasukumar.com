import type { LineLayout, StationLayout, TrackLayout } from './types';

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

/** Part-time stations label on the 'after' side; the rest on 'before'. */
const partTime = new Set(['bad-idea-factory', 'all-things-small', 'uw-lecturer', 'lighthouse-reports']);

const stations: Record<string, StationLayout> = {};
for (const [id, slot] of Object.entries(slots)) {
  stations[id] = { slot, labelSide: partTime.has(id) ? 'after' : 'before' };
}

const straight = (from: number, to: number, lane: number): TrackLayout => ({
  route: [{ slot: from, lane }, { slot: to, lane }],
});

const tracks: Record<string, TrackLayout> = {
  // Full-time bundle
  'journalism-finding-stories-1': straight(0, 8, 0),
  'journalism-storytelling-1': straight(0, 8, 1.12),
  'journalism-tooling-1': straight(1, 8, 2.24),
  // Part-time hatched bundle
  'journalism-tooling-2': straight(4, 9, 5),
  'journalism-storytelling-2': straight(6, 9, 6.12),
  'journalism-tooling-3': straight(6, 9, 7.24),
  'journalism-finding-stories-2': straight(7, 9, 8.36),
};

export const journalismLayout: LineLayout = {
  lineId: 'journalism',
  slotGap: { horizontal: 10, vertical: 8 },
  stations,
  tracks,
  discs: [
    { trackId: 'journalism-finding-stories-1', slot: 8, dt: 2.2, lane: -1.08 },
    { trackId: 'journalism-storytelling-1', slot: 8, dt: 2.2, lane: 1.12 },
    { trackId: 'journalism-tooling-1', slot: 8, dt: 2.2, lane: 3.32 },
    { trackId: 'journalism-storytelling-2', slot: 9, dt: 2.2, lane: 6.6 },
    { trackId: 'journalism-tooling-3', slot: 9, dt: 2.2, lane: 8.8 },
    { trackId: 'journalism-finding-stories-2', slot: 9, dt: 2.2, lane: 11.0 },
  ],
};
