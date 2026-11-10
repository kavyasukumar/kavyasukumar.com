import type { LayoutPoint, LineLayout, StationLayout, TrackLayout } from './types';

/**
 * FIRST DRAFT: journalism (3 tracks) and code (4 tracks) drawn as ONE 7-wide ribbon, so every shared
 * station is an interchange of straight, touching dots. Top to bottom: 5 6 7 (journalism, pink) then
 * 3 2 4 1 (code, ink). Every number below is in lw and meant to be tweaked.
 */

// ---- TWEAK ME: station x positions along the ribbon (lw). Fan stations: centre of the legs. ----
const X: Record<string, number> = {
  'nit-trichy': 0, 'microsoft': 5, 'medill': 10, 'palm-beach-post': 15, 'opennews-fellow': 20, 'vox-media': 25,
  'bad-idea-factory': 0, // set below from K0
  'hearken': 46, 'all-things-small': 55.5, 'uw-lecturer': 63.5, 'washington-post': 67,
  'lightrock-india': 81, 'lighthouse-reports': 83.5, 'aspada': 89,
};
const SPLIT_LH = 69.1; // x where the lowest Lighthouse branch leaves its trunk (just after Washington Post)
const GAP = 5.5; // slotGap (lw per slot); slot = x / GAP

const K0 = 29; // x + lane of the first (journalism 5) 45 degree run north-east at Bad Idea Factory
const UP_TURN = -6.5; // lane where journalism 5 turns from 45 degrees to north
const LINE_GAP = 0.25; // empty space between the last journalism track and the first code track, everywhere they run side by side (quarter track)
const BIF_GAP = LINE_GAP;
const UW_K0 = 51; // x + lane of UW Lecturer's first 45 degree run north-east (R1, between Hearken and WaPo)
const UP_DOT = UP_TURN - 5.4; // lane of the one row of 7 dots, past the widest arc plus 1.5 lw of straight

// ---- TWEAK ME: lane order, top to bottom, by theme number (journalism 5 6 7, code 3 2 4 1) ----
const ORDER = ['5', '6', '7', '1', '3', '2', '4'];
const P = 1.12; // track pitch (rule 10)
const R = 1.5; // inner bend radius (rule 14)
const DIAG = P * Math.SQRT2;
const CODE = ['3', '2', '4', '1'];
const LANE: Record<string, number> = Object.fromEntries(ORDER.map((t, i) => [t, i * P + (CODE.includes(t) ? LINE_GAP : 0)]));
const BOTTOM = 6 * P + LINE_GAP; // lane of the lowest trunk
const TAN = Math.tan(Math.PI / 8);
const DROP = 2.2; // lw below the ribbon before a fan's last turn
const DOT = 15.4; // lane of every gig leg-end dot (ATS, UW)
const DOT_LH = 11.9; // centre lane of the Lighthouse dot column

const pt = (x: number, lane: number): LayoutPoint => ({ slot: x / GAP, lane });

interface Tk { id: string; theme: string }
const byLane = (ts: Tk[]): Tk[] => [...ts].sort((a, b) => LANE[a.theme]! - LANE[b.theme]!);

/** Index of the first code track in a lane-sorted list, and the gap it needs (0 when only one line is present). */
function split(ts: Tk[]): { m: number; g: number } {
  const m = ts.findIndex((k) => CODE.includes(k.theme));
  return { m, g: m > 0 ? LINE_GAP : 0 };
}

/** Straight-through trunk; on top at every crossing (rule 8). A track starts abruptly at its first station. */
const trunk = (from: number, to: number, theme: string): TrackLayout =>
  ({ route: [pt(from, LANE[theme]!), pt(to, LANE[theme]!)], top: true });

/**
 * Gig branches leave their trunks downward, top lane first, cross the trunks below at 45 degrees
 * and turn into touching legs centred on x (the journalism fan). Legs end at DOT (J-curve, rule 20).
 */
function fanDown(all: Tk[], x: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { m, g } = split(ts);
  const V0 = BOTTOM + DROP + (n - 1) * (DIAG - P);
  const out: Record<string, TrackLayout> = {};
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const code = g > 0 && i >= m;
    // Code sits one line gap further out: radius + gap about the same centres keeps the bends concentric.
    const leg = x + (i - (n - 1) / 2) * P + (code ? g / 2 : -g / 2);
    const v = V0 - i * (DIAG - P) - (code ? g * TAN : 0);
    const s = leg - (v - lane);
    out[t.id] = {
      route: [pt(s - 2, lane), pt(s, lane), pt(leg, v), pt(leg, DOT)],
      radii: [R + (n - 1 - i) * P + (g > 0 && i < m ? g : 0), R + i * P + (code ? g : 0)],
      stops: { [station]: pt(leg, DOT) },
    };
  });
  return out;
}

/**
 * Bad Idea Factory (ongoing). All 7 tracks leave their trunks north-east as one bundle, rank g = 0..6
 * top to bottom, one pitch apart (k = x + lane is K0 + g * DIAG), with concentric bends (R + g * P), and
 * turn north together. The 7 dots sit in one straight row at UP_DOT, 5 6 7 3 2 4 1, touching; the
 * renderer runs every leg on north, dashed, off the top edge (rule 27). No crossings.
 */
function bifBranches(all: Tk[], k0 = K0, station = 'bad-idea-factory'): Record<string, TrackLayout> {
  const out: Record<string, TrackLayout> = {};
  byLane(all).forEach((t, g) => {
    const lane = LANE[t.theme]!;
    // Code sits one gap further out: its bends take radius + gap about the same centres, so they stay concentric.
    const gap = CODE.includes(t.theme) ? BIF_GAP : 0;
    const v = UP_TURN + g * (DIAG - P) + gap * Math.tan(Math.PI / 8);
    const leg = k0 - UP_TURN + g * P + gap;
    const k = leg + v; // x + lane along this track's 45 degree run
    out[t.id] = {
      route: [pt(k - lane - 2, lane), pt(k - lane, lane), pt(leg, v), pt(leg, UP_DOT)],
      radii: [R + g * P + gap, R + g * P + gap],
      stops: { [station]: pt(leg, UP_DOT) },
    };
  });
  return out;
}

/** Lighthouse: branches peel off at Washington Post, leave south-east, then run east to a column of dots. */
function fanDownThenEast(all: Tk[], x: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { m, g } = split(ts);
  const out: Record<string, TrackLayout> = {};
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const code = g > 0 && i >= m;
    const run = DOT_LH + (i - (n - 1) / 2) * P + (code ? g / 2 : -g / 2);
    const c = SPLIT_LH - BOTTOM + (n - 1 - i) * DIAG + (g > 0 && i < m ? g * Math.SQRT2 : 0); // x - lane along this branch's 45 degree run
    out[t.id] = {
      // Starts on the trunk at Washington Post: no run-on past it.
      route: [pt(X['washington-post']!, lane), pt(c + lane, lane), pt(c + run, run), pt(x, run)],
      radii: [R + (n - 1 - i) * P + (g > 0 && i < m ? g : 0), R + i * P + (code ? g : 0)],
      stops: { [station]: pt(x, run) },
    };
  });
  return out;
}

const J = 'journalism-';
const C = 'code-';
const t = (id: string, theme: string): Tk => ({ id, theme });
const bif = [
  t(`${J}finding-stories-2`, '5'), t(`${J}storytelling-2`, '6'), t(`${J}tooling-2`, '7'),
  t(`${C}data-science-2`, '3'), t(`${C}sjw-coder-2`, '2'), t(`${C}open-source-2`, '4'), t(`${C}love-of-code-2`, '1'),
];
const ats = [t(`${J}storytelling-3`, '6'), t(`${J}tooling-3`, '7'), t(`${C}data-science-3`, '3'), t(`${C}love-of-code-3`, '1')];
const uw = [
  t(`${J}finding-stories-3`, '5'), t(`${J}storytelling-4`, '6'), t(`${J}tooling-4`, '7'),
  t(`${C}data-science-4`, '3'), t(`${C}sjw-coder-3`, '2'), t(`${C}open-source-3`, '4'),
];
const lh = [
  t(`${J}finding-stories-4`, '5'), t(`${J}storytelling-5`, '6'), t(`${J}tooling-5`, '7'),
  t(`${C}data-science-5`, '3'), t(`${C}sjw-coder-4`, '2'), t(`${C}open-source-4`, '4'), t(`${C}love-of-code-4`, '1'),
];

const wapo = X['washington-post']!;
const tracks: Record<string, TrackLayout> = {
  // Journalism trunks (full-time roles, rule 37); they end at Washington Post.
  [`${J}finding-stories-1`]: trunk(X['medill']!, wapo, '5'),
  [`${J}storytelling-1`]: trunk(X['medill']!, wapo, '6'),
  [`${J}tooling-1`]: trunk(X['palm-beach-post']!, wapo, '7'),
  // Code trunks. Each starts at its first station. Love of code and Data science are ongoing.
  [`${C}love-of-code-1`]: trunk(X['nit-trichy']!, X['aspada']!, '1'),
  [`${C}open-source-1`]: trunk(X['nit-trichy']!, wapo, '4'),
  [`${C}sjw-coder-1`]: trunk(X['opennews-fellow']!, X['lightrock-india']!, '2'),
  [`${C}data-science-1`]: trunk(X['palm-beach-post']!, X['aspada']!, '3'),
  ...bifBranches(bif),
  ...fanDown(ats, X['all-things-small']!, 'all-things-small'),
  ...bifBranches(uw, UW_K0, 'uw-lecturer'),
  ...fanDownThenEast(lh, X['lighthouse-reports']!, 'lighthouse-reports'),
};

const sides: Record<string, StationLayout['labelSide']> = {
  'bad-idea-factory': 'back', 'all-things-small': 'back', 'uw-lecturer': 'tip', 'lighthouse-reports': 'tip',
};
X['bad-idea-factory'] = K0 - UP_TURN + P; // slot only: label and order; dots are placed explicitly
const stations: Record<string, StationLayout> = {};
for (const [id, x] of Object.entries(X)) stations[id] = { slot: x / GAP, labelSide: sides[id] ?? 'before' };
// Phone: the All Things Small label goes under its dots, clear of the fan's bends above them.
stations['all-things-small']!.vUnder = true;

export const careerLayout: LineLayout = {
  lineId: 'journalism',
  lineIds: ['journalism', 'code'],
  slotGap: { horizontal: GAP, vertical: GAP },
  minLw: 12, // draft: as close to 16px per track as 14 stations x 7 tracks allow at 1440
  stations,
  tracks,
  discs: [],
};
