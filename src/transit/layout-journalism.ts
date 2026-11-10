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

/** Gig labels sit above their stubs, in the gap under the full-time bundle;
 *  Bad Idea Factory's label goes below its bundle at the bottom. */
const after = new Set(['bad-idea-factory']);

const stations: Record<string, StationLayout> = {};
for (const [id, slot] of Object.entries(slots)) {
  stations[id] = { slot, labelSide: after.has(id) ? 'after' : 'before' };
}

const straight = (from: number, to: number, lane: number): TrackLayout => ({
  route: [{ slot: from, lane }, { slot: to, lane }],
});

/** A one-station track: a short stub centred on the station slot. */
const STUB_HALF = 0.25;
const stub = (slot: number, lane: number): TrackLayout => ({
  route: [{ slot: slot - STUB_HALF, lane }, { slot: slot + STUB_HALF, lane }],
});

/** Discs for tracks ending at one slot, stacked down from the gig stubs, above the Bad Idea Factory bundle. */
const DISC_DT = 4.2;
const stack = (slot: number, ids: string[]) =>
  ids.map((trackId, i) => ({ trackId, slot, dt: DISC_DT, lane: 7.5 + i * 2.2 }));

const tracks: Record<string, TrackLayout> = {
  // Full-time bundle
  'journalism-finding-stories-1': straight(0, 8, 0),
  'journalism-storytelling-1': straight(0, 8, 1.12),
  'journalism-tooling-1': straight(1, 8, 2.24),
  // Part-time. Gig stubs (lanes 7.5-9.74) sit under the full-time bundle; gigs
  // never chain (rule 37). Bad Idea Factory's ongoing 5b, 6b, 7b run below them
  // (lanes 15-17.24), clear of the gigs' discs, to the edge.
  'journalism-finding-stories-2': straight(4, 9, 15),
  'journalism-storytelling-2': straight(4, 9, 16.12),
  'journalism-tooling-2': straight(4, 9, 17.24),
  'journalism-storytelling-3': stub(6, 7.5),
  'journalism-tooling-3': stub(6, 8.62),
  'journalism-finding-stories-3': stub(7, 7.5),
  'journalism-storytelling-4': stub(7, 8.62),
  'journalism-tooling-4': stub(7, 9.74),
  'journalism-finding-stories-4': stub(9, 7.5),
  'journalism-storytelling-5': stub(9, 8.62),
  'journalism-tooling-5': stub(9, 9.74),
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
    ...stack(6, ['journalism-storytelling-3', 'journalism-tooling-3']),
    ...stack(7, ['journalism-finding-stories-3', 'journalism-storytelling-4', 'journalism-tooling-4']),
    ...stack(9, ['journalism-finding-stories-4', 'journalism-storytelling-5', 'journalism-tooling-5']),
  ],
};
