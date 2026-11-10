import type { LayoutPoint, LineLayout, StationLayout, TrackLayout } from './types';

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

/**
 * Full-time stops label above the trunk; nothing runs above it. Gigs end in J-curves and
 * label at the tip (rule 20); Bad Idea Factory labels beside its dots.
 */
const sides: Record<string, StationLayout['labelSide']> = {
  'bad-idea-factory': 'back',
  'all-things-small': 'tip',
  'uw-lecturer': 'tip',
  'lighthouse-reports': 'tip',
};

const stations: Record<string, StationLayout> = {};
for (const [id, slot] of Object.entries(slots)) {
  stations[id] = { slot, labelSide: sides[id] ?? 'before' };
}

// Geometry below is in lw: x runs along time (slot * GAP), lane runs across.
const GAP = 8; // lw per slot, both orientations
const P = 1.12; // track pitch (rule 10)
const R = 1.5; // inner bend radius (rule 14)
const DIAG = P * Math.SQRT2; // x offset between parallel 45 degree tracks one pitch apart
const V0 = 5.1; // lane where a fan's inner branch turns from 45 degrees into its leg
const DOT = 7.8; // lane of every leg-end dot: gigs and Bad Idea Factory share one row
const BIF = 12.5; // top lane of the Bad Idea Factory bundle along the bottom
const EDGE = 9.9 * GAP; // ongoing branches are run on to the canvas edge by the renderer

const LANE: Record<string, number> = { '5': 0, '6': P, '7': 2 * P };
const pt = (x: number, lane: number): LayoutPoint => ({ slot: x / GAP, lane });

/** Trunk: straight through, so it stays on top at every crossing (rule 8). */
const trunk = (from: number, to: number, lane: number): TrackLayout => ({
  route: [pt(from * GAP, lane), pt(to * GAP, lane)],
  top: true,
});

/**
 * Branches that leave their trunks downward, upper theme first, cross the trunks below
 * at 45 degrees (rule 18) and turn into parallel legs that touch, centred on x. A leg
 * ends at DOT (single-stop J-curve, rule 20) or, for ongoing work, carries on down and
 * turns along the bottom to the edge (rule 27) with its dot on the leg.
 */
function fanDown(themes: string[], ids: string[], x: number, station: string, ongoing = false): Record<string, TrackLayout> {
  const n = themes.length;
  const out: Record<string, TrackLayout> = {};
  themes.forEach((th, i) => {
    const lane = LANE[th]!;
    const leg = x + (i - (n - 1) / 2) * P;
    const v = V0 - i * (DIAG - P);
    const s = leg - (v - lane);
    const route = [pt(s - 2, lane), pt(s, lane), pt(leg, v)];
    // Concentric departure bend: the lower track is on the inside, so it takes the smaller radius.
    const radii = [R + (n - 1 - i) * P, R + i * P];
    if (ongoing) {
      const lane2 = BIF + (n - 1 - i) * P;
      route.push(pt(leg, lane2), pt(EDGE, lane2));
      radii.push(R + (n - 1 - i) * P);
    } else {
      route.push(pt(leg, DOT));
    }
    out[ids[i]!] = { route, radii, stops: { [station]: pt(leg, DOT) } };
  });
  return out;
}

/**
 * Branches that leave the trunk downward before it ends, lowest theme first, so the upper
 * themes cross the trunks below at 45 degrees (rule 18). Each turns east (concentric bends,
 * rule 14) onto a straight run below the trunk and stops on it, dots touching in a column
 * centred on DOT. The track ends square 0.6 lw past the dots (rule 26). Owner decision.
 */
function fanDownThenEast(themes: string[], ids: string[], firstSplit: number, x: number, station: string): Record<string, TrackLayout> {
  const n = themes.length;
  const out: Record<string, TrackLayout> = {};
  const cLast = firstSplit - LANE[themes[n - 1]!]!; // x - lane along the lowest theme's 45 degree run
  themes.forEach((th, i) => {
    const lane = LANE[th]!;
    const c = cLast + (n - 1 - i) * DIAG;
    const run = DOT + (i - (n - 1) / 2) * P;
    out[ids[i]!] = {
      route: [pt(c + lane - 2, lane), pt(c + lane, lane), pt(c + run, run), pt(x + 0.5, run)],
      // Departure turns right (lower track inside), arrival turns left (upper track inside).
      radii: [R + (n - 1 - i) * P, R + i * P],
      stops: { [station]: pt(x, run) },
    };
  });
  return out;
}

const J = 'journalism-';
const tracks: Record<string, TrackLayout> = {
  // Trunks: full-time work (rule 37).
  [`${J}finding-stories-1`]: trunk(0, 8, LANE['5']!),
  [`${J}storytelling-1`]: trunk(0, 8, LANE['6']!),
  [`${J}tooling-1`]: trunk(1, 8, LANE['7']!),
  // Bad Idea Factory (ongoing) splits just after Vox Media, stops on the drop, runs along the bottom to TODAY.
  ...fanDown(['5', '6', '7'], [`${J}finding-stories-2`, `${J}storytelling-2`, `${J}tooling-2`], 4 * GAP + 0.82, 'bad-idea-factory', true),
  // Gigs never chain (rule 37): each is a single-stop J-curve (rule 20).
  ...fanDown(['6', '7'], [`${J}storytelling-3`, `${J}tooling-3`], 6 * GAP, 'all-things-small'),
  ...fanDown(['5', '6', '7'], [`${J}finding-stories-3`, `${J}storytelling-4`, `${J}tooling-4`], 7 * GAP, 'uw-lecturer'),
  // Lighthouse Reports leaves the trunk south-east before Washington Post, then runs east to its stop.
  ...fanDownThenEast(['5', '6', '7'], [`${J}finding-stories-4`, `${J}storytelling-5`, `${J}tooling-5`], 58, 9 * GAP, 'lighthouse-reports'),
};

export const journalismLayout: LineLayout = {
  lineId: 'journalism',
  slotGap: { horizontal: GAP, vertical: GAP },
  stations,
  tracks,
  discs: [], // No terminal discs (rule 26, owner decision)
};
