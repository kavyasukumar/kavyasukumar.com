import type { LayoutPoint, LineLayout, StationLayout, TrackLayout } from './types';

/**
 * Journalism (3 tracks), code (4) and product (3) drawn as ONE 10-wide ribbon, so every shared station is
 * an interchange of straight, touching dots. Top to bottom: 5 6 7 (journalism, pink) | 1 3 2 4 (code, forest)
 * | 8 9 10 (product, mint), a line gap between lines. Every number below is in lw and meant to be tweaked.
 */

// ---- TWEAK ME: station x positions along the ribbon (lw). Fan stations: centre of the legs. ----
const X0: Record<string, number> = {
  'nit-trichy': 0, 'microsoft': 5, 'medill': 10, 'palm-beach-post': 15, 'opennews-fellow': 20, 'vox-media': 25,
  'bad-idea-factory': 0, // set in build() from k0
  'hearken': 46, 'seattle-globalist': 55, 'all-things-small': 65, 'uw-lecturer': 63.5, 'washington-post': 67,
  'lightrock-india': 81, 'lighthouse-reports': 86, 'aspada': 89,
};
const SPLIT_LH = 69.1; // x where the lowest Lighthouse branch leaves its trunk (just after Washington Post)
const GAP = 5.5; // slotGap (lw per slot); slot = x / GAP

const LINE_GAP = 0.25; // empty space between two lines' tracks, everywhere they run side by side (quarter track)

/** Spacing across the ribbon (lanes). Desktop rows R1 and R3 are about 20% taller than the phone's (P7). */
interface Spacing {
  k0: number; // x + lane of the first (journalism 5) 45 degree run north-east at Bad Idea Factory
  upTurn: number; // lane where journalism 5 turns from 45 degrees to north
  uwK0: number; // x + lane of UW Lecturer's first 45 degree run north-east (R1, between Hearken and WaPo)
  upDot: number; // lane of the BIF and UW dot rows, past the widest arc plus 1.5 lw of straight
  drop: number; // lw below the ribbon before a fan's last turn
  dot: number; // lane of every gig leg-end dot below the ribbon (Seattle Globalist, ATS)
  dotLh: number; // centre lane of the Lighthouse dot column
}
const DESKTOP: Spacing = { k0: 27.5, upTurn: -7.8, uwK0: 52, upDot: -7.8 - 6.5, drop: 2.64, dot: 20.9, dotLh: 16.2 };
const PHONE: Spacing = { k0: 29, upTurn: -6.5, uwK0: 51, upDot: -6.5 - 5.4, drop: 2.2, dot: 19, dotLh: 16.2 };

// ---- TWEAK ME: lane order, top to bottom, by theme number (journalism 5 6 7, code 1 3 2 4, product 8 9 10) ----
const ORDER = ['5', '6', '7', '1', '3', '2', '4', '8', '9', '10']; // journalism | code | product
const P = 1.12; // track pitch (rule 10)
const R = 1.5; // inner bend radius (rule 14)
const DIAG = P * Math.SQRT2;
const LINE_OF: Record<string, number> = { '5': 0, '6': 0, '7': 0, '1': 1, '3': 1, '2': 1, '4': 1, '8': 2, '9': 2, '10': 2 };
const LANE: Record<string, number> = Object.fromEntries(ORDER.map((t, i) => [t, i * P + LINE_OF[t]! * LINE_GAP]));
const BOTTOM = 9 * P + 2 * LINE_GAP; // lane of the lowest trunk
const TAN = Math.tan(Math.PI / 8);

const pt = (x: number, lane: number): LayoutPoint => ({ slot: x / GAP, lane });

interface Tk { id: string; theme: string }
const byLane = (ts: Tk[]): Tk[] => [...ts].sort((a, b) => LANE[a.theme]! - LANE[b.theme]!);

/** Per-track extra offset (one LINE_GAP per line boundary above it among the lines present) and the total. */
function offsets(ts: Tk[]): { off: number[]; tot: number } {
  const lines = [...new Set(ts.map((k) => LINE_OF[k.theme]!))].sort();
  return { off: ts.map((k) => lines.indexOf(LINE_OF[k.theme]!) * LINE_GAP), tot: (lines.length - 1) * LINE_GAP };
}

/** Straight-through trunk; on top at every crossing (rule 8). A track starts abruptly at its first station. */
const trunk = (from: number, to: number, theme: string): TrackLayout =>
  ({ route: [pt(from, LANE[theme]!), pt(to, LANE[theme]!)], top: true });

/**
 * Gig branches leave their trunks downward, top lane first, cross the trunks below at 45 degrees
 * and turn into touching legs centred on x (the journalism fan). Legs end at sp.dot (J-curve, rule 20).
 */
function fanDown(sp: Spacing, all: Tk[], x: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { off, tot } = offsets(ts);
  const V0 = BOTTOM + sp.drop + (n - 1) * (DIAG - P);
  const out: Record<string, TrackLayout> = {};
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const o = off[i]!;
    // Each line sits one gap further out: radius + offset about the same centres keeps bends concentric.
    const leg = x + (i - (n - 1) / 2) * P + o - tot / 2;
    const v = V0 - i * (DIAG - P) - o * TAN;
    const s = leg - (v - lane);
    out[t.id] = {
      route: [pt(s - 2, lane), pt(s, lane), pt(leg, v), pt(leg, sp.dot)],
      radii: [R + (n - 1 - i) * P + (tot - o), R + i * P + o],
      stops: { [station]: pt(leg, sp.dot) },
    };
  });
  return out;
}

/**
 * Bad Idea Factory (ongoing). All 7 tracks leave their trunks north-east as one bundle, rank g = 0..6
 * top to bottom, one pitch apart (k = x + lane is k0 + g * DIAG), with concentric bends (R + g * P), and
 * turn north together. The 7 dots sit in one straight row at upDot, 5 6 7 1 3 2 4, touching; the
 * renderer runs every leg on north, dashed, off the top edge (rule 27). No crossings.
 */
function bifBranches(sp: Spacing, all: Tk[], k0 = sp.k0, station = 'bad-idea-factory'): Record<string, TrackLayout> {
  const out: Record<string, TrackLayout> = {};
  const ts = byLane(all);
  const { off } = offsets(ts);
  ts.forEach((t, g) => {
    const lane = LANE[t.theme]!;
    const gap = off[g]!;
    const v = sp.upTurn + g * (DIAG - P) + gap * TAN;
    const leg = k0 - sp.upTurn + g * P + gap;
    const k = leg + v; // x + lane along this track's 45 degree run
    out[t.id] = {
      route: [pt(k - lane - 2, lane), pt(k - lane, lane), pt(leg, v), pt(leg, sp.upDot)],
      radii: [R + g * P + gap, R + g * P + gap],
      stops: { [station]: pt(leg, sp.upDot) },
      // The BIF diagonals pass over product 8's back-branch, with the usual casing (low/over).
      ...(station === 'bad-idea-factory' ? { over: ['product-product-mgmt-2'] } : {}),
    };
  });
  return out;
}

/** Lighthouse: branches peel off at Washington Post, leave south-east, then run east to a column of dots. */
function fanDownThenEast(sp: Spacing, X: Record<string, number>, all: Tk[], x: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { off, tot } = offsets(ts);
  const out: Record<string, TrackLayout> = {};
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const o = off[i]!;
    const run = sp.dotLh + (i - (n - 1) / 2) * P + o - tot / 2;
    const c = SPLIT_LH - LANE[ts[n - 1]!.theme]! + (n - 1 - i) * DIAG + (tot - o) * Math.SQRT2; // x - lane along this branch's 45 degree run
    out[t.id] = {
      // Starts on the trunk at Washington Post: no run-on past it.
      route: [pt(X['washington-post']!, lane), pt(c + lane, lane), pt(c + run, run), pt(x, run)],
      radii: [R + (n - 1 - i) * P + (tot - o), R + i * P + o],
      stops: { [station]: pt(x, run) },
    };
  });
  return out;
}

// Product 8 reaches Bad Idea Factory by branching back from Hearken: it starts at Hearken's 8 dot (the trunk runs
// east from the same dot), runs a short straight west, climbs NORTH-WEST at 45 degrees through the ribbon trunks,
// then turns north as the WESTMOST BIF leg (row: 8 | 5 6 7 | 1 3 2 4). Going north it crosses the BIF bundle's
// north-east diagonals at 45 degrees and goes UNDER them: it is `low`, and the diagonals take a cream casing.
const BACK_STRAIGHT = 2.2; // lw of straight west of the Hearken dot before the 45 degree bend
function hearkenBack(sp: Spacing, X: Record<string, number>): Record<string, TrackLayout> {
  const id = 'product-product-mgmt-2';
  const leg = sp.k0 - sp.upTurn - P - LINE_GAP; // west of journalism 5's leg, one line gap away
  const xw = X['hearken']! - BACK_STRAIGHT;
  const vB = LANE['8']! - (xw - leg); // lane where the diagonal reaches the leg
  return {
    [id]: {
      route: [pt(X['hearken']!, LANE['8']!), pt(xw, LANE['8']!), pt(leg, vB), pt(leg, sp.upDot)],
      radii: [R, R],
      stops: { 'bad-idea-factory': pt(leg, sp.upDot) },
      low: true,
    },
  };
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

const P_ = 'product-';
const atsP = [t(`${P_}product-mgmt-3`, '8'), t(`${P_}economics-2`, '9')];
const sg = [t(`${P_}fundraising-2`, '10')];
const sides: Record<string, StationLayout['labelSide']> = {
  'bad-idea-factory': 'back', 'all-things-small': 'tip', 'seattle-globalist': 'tip', 'uw-lecturer': 'tip', 'lighthouse-reports': 'tip',
};
/** Tracks and stations for one spacing (desktop or phone). */
function build(sp: Spacing): Pick<LineLayout, 'stations' | 'tracks'> {
  const X: Record<string, number> = { ...X0 };
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
    ...bifBranches(sp, bif),
    ...hearkenBack(sp, X),
    // Product (mint, ongoing): trunks start abruptly at Hearken and run on to Aspada.
    [`${P_}product-mgmt-1`]: trunk(X['hearken']!, X['aspada']!, '8'),
    [`${P_}economics-1`]: trunk(X['hearken']!, X['aspada']!, '9'),
    [`${P_}fundraising-1`]: trunk(X['hearken']!, X['aspada']!, '10'),
    ...fanDown(sp, sg, X['seattle-globalist']!, 'seattle-globalist'),
    ...fanDown(sp, [...ats, ...atsP], X['all-things-small']!, 'all-things-small'),
    ...bifBranches(sp, uw, sp.uwK0, 'uw-lecturer'),
    ...fanDownThenEast(sp, X, lh, X['lighthouse-reports']!, 'lighthouse-reports'),
  };

  X['bad-idea-factory'] = sp.k0 - sp.upTurn + P; // slot only: label and order; dots are placed explicitly
  const stations: Record<string, StationLayout> = {};
  for (const [id, x] of Object.entries(X)) stations[id] = { slot: x / GAP, labelSide: sides[id] ?? 'before' };
  // Phone: the All Things Small label goes under its dots, clear of the fan's bends above them.
  stations['all-things-small']!.vUnder = true;
  return { stations, tracks };
}

export const careerLayout: LineLayout = {
  lineId: 'journalism',
  lineIds: ['journalism', 'code', 'product'], // key order follows the ribbon, top to bottom
  slotGap: { horizontal: GAP, vertical: GAP },
  minLw: 12, // draft: as close to 16px per track as 14 stations x 7 tracks allow at 1440
  ...build(DESKTOP),
  discs: [],
};
/** The vertical (phone) layout: same stations and order, R1 and R3 without the desktop's extra 20%. */
careerLayout.vertical = { ...careerLayout, ...build(PHONE) };
