import type { LayoutPoint, LineLayout, StationLayout, TrackLayout, TrackLetter } from './types';

/**
 * Journalism (3 tracks), code (4), leadership (2), investing (2) and product (3) drawn as ONE 14-wide ribbon,
 * so every shared station is an interchange of straight, touching dots. Top to bottom: A B C (journalism, pink) |
 * D E F G (code, forest) | K L (leadership, raspberry) | M N (investing, ink) | H I J (product, mint), a line gap
 * between lines. Every number below is in lw and meant to be tweaked.
 */

// ---- TWEAK ME: station x positions along the ribbon (lw). Fan stations: centre of the legs. ----
const X0: Record<string, number> = {
  'nit-trichy': 0, 'microsoft': 5, 'medill': 10, 'palm-beach-post': 15, 'opennews': 20, 'vox-media': 25,
  'bad-idea-factory': 0, // set in build() from k0
  'hearken': 46, 'seattle-globalist': 55, 'all-things-small': 65, 'uw-lecturer': 63.5, 'washington-post': 67,
  'lightrock-india': 81, 'lighthouse-reports': 86, 'aspada': 89,
};
const GAP = 5.5; // slotGap (lw per slot); slot = x / GAP

const LINE_GAP = 0.25; // empty space between two lines' tracks, everywhere they run side by side (quarter track)

/** Spacing across the ribbon (lanes). Desktop rows R1 and R3 are about 44% taller than the phone's (P7, then LD4). */
interface Spacing {
  k0: number; // x + lane of the first (journalism A) 45 degree run north-east at Bad Idea Factory
  upTurn: number; // lane where journalism A turns from 45 degrees to north
  uwK0: number; // x + lane of Uni. of Washington's first 45 degree run north-east (R1, between Hearken and WaPo)
  upDot: number; // lane of the BIF and UW dot rows, past the widest arc plus 1.5 lw of straight
  drop: number; // lw below the ribbon before a fan's last turn
  dot: number; // lane of every gig leg-end dot below the ribbon (Seattle Globalist, ATS)
  dotLh: number; // centre lane of the Lighthouse dot column
  splitLh: number; // x where the lowest Lighthouse branch leaves its trunk (just after Washington Post)
  x: Record<string, number>; // station x overrides (along time) for this spacing
}
// Desktop R1-R3 are another ~20% taller (LD4), and WaPo, LightRock and Aspada sit further east so the WaPo
// label clears Uni. of Washington's legs. Medill sits 0.9 lw west so its label clears Palm Beach Post's by at least
// 1 lw at 1280 (Palm Beach Post, OpenNews and Vox Media have no room to move east: Vox's dots already touch the Bad
// Idea Factory bends). The phone keeps ORDER 16's spacing and x positions.
const DESKTOP: Spacing = {
  k0: 27.5, upTurn: -9.4, uwK0: 49.5, upDot: -9.4 - 7.8, drop: 3.2, dot: 27.9, dotLh: 23.1, splitLh: 69.8,
  x: { 'medill': 9.1, 'opennews': 21.5, 'vox-media': 26.5, 'washington-post': 69, 'lightrock-india': 83, 'lighthouse-reports': 88, 'aspada': 91 },
};
// Investing's two lanes (2 pitches + 1 line gap = 2.49 lw) push R3 down: desktop dot and dotLh follow the investing
// experiment (+2.2 lw each); the phone moves both by the full 2.49, so its legs and Lighthouse clearance are unchanged.
const PHONE: Spacing = { k0: 29, upTurn: -6.5, uwK0: 50, upDot: -6.5 - 5.4, drop: 2.2, dot: 27.5, dotLh: 21.9, splitLh: 69.1, x: {} };

// ---- TWEAK ME: lane order, top to bottom, by track letter (journalism A B C, code D E F G, leadership K L, investing M N, product H I J) ----
type Lane = TrackLetter;
const ORDER: readonly Lane[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'K', 'L', 'M', 'N', 'H', 'I', 'J']; // journalism | code | leadership | investing | product
const P = 1.12; // track pitch (rule 10)
const R = 1.5; // inner bend radius (rule 14)
const DIAG = P * Math.SQRT2;
const LINE_OF: Record<Lane, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 1, 'E': 1, 'F': 1, 'G': 1, 'K': 2, 'L': 2, 'M': 3, 'N': 3, 'H': 4, 'I': 4, 'J': 4 };
const LANE = Object.fromEntries(ORDER.map((t, i) => [t, i * P + LINE_OF[t] * LINE_GAP])) as Record<Lane, number>;
const BOTTOM = 13 * P + 4 * LINE_GAP; // lane of the lowest trunk
const TAN = Math.tan(Math.PI / 8);

const pt = (x: number, lane: number): LayoutPoint => ({ slot: x / GAP, lane });

interface Tk { id: string; theme: Lane }
const byLane = (ts: Tk[]): Tk[] => [...ts].sort((a, b) => LANE[a.theme]! - LANE[b.theme]!);

/** Per-track extra offset (one LINE_GAP per line boundary above it among the lines present) and the total. */
function offsets(ts: Tk[]): { off: number[]; tot: number } {
  const lines = [...new Set(ts.map((k) => LINE_OF[k.theme]!))].sort();
  return { off: ts.map((k) => lines.indexOf(LINE_OF[k.theme]!) * LINE_GAP), tot: (lines.length - 1) * LINE_GAP };
}

/** Straight-through trunk; on top at every crossing (rule 8). A track starts abruptly at its first station. */
const trunk = (from: number, to: number, theme: Lane): TrackLayout =>
  ({ route: [pt(from, LANE[theme]!), pt(to, LANE[theme]!)], top: true });

/**
 * Gig branches leave their trunks downward, top lane first, cross the trunks below at 45 degrees
 * and turn into touching legs centred on x (the journalism fan). Legs end at sp.dot (J-curve, rule 20).
 */
function fanDown(sp: Spacing, all: Tk[], x: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { off, tot } = offsets(ts);
  // The 45 degree run of track i must be long enough that neither of its bends is clamped (roundedPath
  // halves the room between bends), or its radius stops matching its neighbours and the gap goes uneven.
  const need = ts.map((t, i) => LANE[t.theme]! + i * (DIAG - P) + off[i]! * TAN + (R + i * P + off[i]!) * 0.586 + 0.3);
  const V0 = Math.max(BOTTOM + sp.drop + (n - 1) * (DIAG - P), ...need);
  const out: Record<string, TrackLayout> = {};
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const o = off[i]!;
    // Each line sits one gap further out: radius + offset about the same centres keeps bends concentric.
    const leg = x + (i - (n - 1) / 2) * P + o - tot / 2;
    const v = V0 - i * (DIAG - P) - o * TAN;
    const s = leg - (v - lane);
    out[t.id] = {
      route: [pt(s - 6, lane), pt(s, lane), pt(leg, v), pt(leg, sp.dot)],
      radii: [R + (n - 1 - i) * P + (tot - o), R + i * P + o],
      stops: { [station]: pt(leg, sp.dot) },
    };
  });
  return out;
}

/**
 * Bad Idea Factory (ongoing). All 7 tracks leave their trunks north-east as one bundle, rank g = 0..6
 * top to bottom, one pitch apart (k = x + lane is k0 + g * DIAG), with concentric bends (R + g * P), and
 * turn north together. The 7 dots sit in one straight row at upDot, A B C D E F G, touching; the
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
      route: [pt(k - lane - 5, lane), pt(k - lane, lane), pt(leg, v), pt(leg, sp.upDot)],
      radii: [R + g * P + gap, R + g * P + gap],
      stops: { [station]: pt(leg, sp.upDot) },
      // The BIF diagonals pass over product H's back-branch, with the usual casing (low/over).
      ...(station === 'bad-idea-factory' ? { over: ['product-product-mgmt-2'] } : {}),
    };
  });
  return out;
}

/** Lighthouse: branches peel off at Washington Post, leave south-east, then run east to a column of dots. */
function fanDownThenEast(sp: Spacing, X: Record<string, number>, all: Tk[], x0: number, station: string): Record<string, TrackLayout> {
  const ts = byLane(all);
  const n = ts.length;
  const { off, tot } = offsets(ts);
  const out: Record<string, TrackLayout> = {};
  const runOf = (i: number): number => sp.dotLh + (i - (n - 1) / 2) * P + off[i]! - tot / 2;
  // x - lane along branch i's 45 degree run
  const cOf = (i: number): number => sp.splitLh - LANE[ts[n - 1]!.theme]! + (n - 1 - i) * DIAG + (tot - off[i]!) * Math.SQRT2;
  // The 45 degree runs must end 1.5 lw plus the arc's tangent before the dots, or the bend hooks past them.
  const x = Math.max(x0, ...ts.map((_, i) => cOf(i) + runOf(i) + 1.5 + (R + i * P + off[i]!) * TAN));
  X[station] = x;
  ts.forEach((t, i) => {
    const lane = LANE[t.theme]!;
    const o = off[i]!;
    const run = runOf(i);
    const c = cOf(i);
    out[t.id] = {
      // Starts on the trunk at Washington Post: no run-on past it.
      route: [pt(X['washington-post']!, lane), pt(c + lane, lane), pt(c + run, run), pt(x, run)],
      radii: [R + (n - 1 - i) * P + (tot - o), R + i * P + o],
      stops: { [station]: pt(x, run) },
    };
  });
  return out;
}

// Product H reaches Bad Idea Factory by branching back from Hearken: it starts at Hearken's H dot (the trunk runs
// east from the same dot), runs a short straight west, climbs NORTH-WEST at 45 degrees through the ribbon trunks,
// then turns north as the WESTMOST BIF leg (row: H | A B C | D E F G). Going north it crosses the BIF bundle's
// north-east diagonals at 45 degrees and goes UNDER them: it is `low`, and the diagonals take a cream casing.
const BACK_STRAIGHT = 2.2; // lw of straight west of the Hearken dot before the 45 degree bend
function hearkenBack(sp: Spacing, X: Record<string, number>): Record<string, TrackLayout> {
  const id = 'product-product-mgmt-2';
  const leg = sp.k0 - sp.upTurn - P - LINE_GAP; // west of journalism A's leg, one line gap away
  const xw = X['hearken']! - BACK_STRAIGHT;
  const vB = LANE['H']! - (xw - leg); // lane where the diagonal reaches the leg
  return {
    [id]: {
      route: [pt(X['hearken']!, LANE['H']!), pt(xw, LANE['H']!), pt(leg, vB), pt(leg, sp.upDot)],
      radii: [R, R],
      stops: { 'bad-idea-factory': pt(leg, sp.upDot) },
      low: true,
    },
  };
}

const J = 'journalism-';
const C = 'code-';
const t = (id: string, theme: Lane): Tk => ({ id, theme });
const bif = [
  t(`${J}finding-stories-2`, 'A'), t(`${J}storytelling-2`, 'B'), t(`${J}tooling-2`, 'C'),
  t(`${C}data-science-2`, 'E'), t(`${C}sjw-coder-2`, 'F'), t(`${C}open-source-2`, 'G'), t(`${C}love-of-code-2`, 'D'),
];
const ats = [t(`${J}storytelling-3`, 'B'), t(`${J}tooling-3`, 'C'), t(`${C}data-science-3`, 'E'), t(`${C}love-of-code-3`, 'D')];
const uw = [
  t(`${J}finding-stories-3`, 'A'), t(`${J}storytelling-4`, 'B'), t(`${J}tooling-4`, 'C'),
  t(`${C}data-science-4`, 'E'), t(`${C}sjw-coder-3`, 'F'), t(`${C}open-source-3`, 'G'),
  t('leadership-evangelism-3', 'L'),
];
const lh = [
  t(`${J}finding-stories-4`, 'A'), t(`${J}storytelling-5`, 'B'), t(`${J}tooling-5`, 'C'),
  t(`${C}data-science-5`, 'E'), t(`${C}sjw-coder-4`, 'F'), t(`${C}open-source-4`, 'G'), t(`${C}love-of-code-4`, 'D'),
  t('leadership-evangelism-4', 'L'),
];

const P_ = 'product-';
const L_ = 'leadership-';
const atsP = [t(`${P_}product-mgmt-3`, 'H'), t(`${P_}economics-2`, 'I'), t(`${L_}team-3`, 'K')];
const sg = [t(`${P_}fundraising-2`, 'J'), t(`${L_}team-2`, 'K'), t(`${L_}evangelism-2`, 'L')];
const sides: Record<string, StationLayout['labelSide']> = {
  'bad-idea-factory': 'back', 'all-things-small': 'tip', 'seattle-globalist': 'tip', 'uw-lecturer': 'tip', 'lighthouse-reports': 'tip',
};
/** Tracks and stations for one spacing (desktop or phone). */
function build(sp: Spacing): Pick<LineLayout, 'stations' | 'tracks'> {
  const X: Record<string, number> = { ...X0, ...sp.x };
  const wapo = X['washington-post']!;
  const tracks: Record<string, TrackLayout> = {
    // Journalism trunks (full-time roles, rule 37); they end at Washington Post.
    [`${J}finding-stories-1`]: trunk(X['medill']!, wapo, 'A'),
    [`${J}storytelling-1`]: trunk(X['medill']!, wapo, 'B'),
    [`${J}tooling-1`]: trunk(X['palm-beach-post']!, wapo, 'C'),
    // Code trunks. Each starts at its first station. Love of code and Data science are ongoing.
    [`${C}love-of-code-1`]: trunk(X['nit-trichy']!, X['aspada']!, 'D'),
    [`${C}open-source-1`]: trunk(X['nit-trichy']!, wapo, 'G'),
    [`${C}sjw-coder-1`]: trunk(X['opennews']!, X['lightrock-india']!, 'F'),
    [`${C}data-science-1`]: trunk(X['palm-beach-post']!, X['aspada']!, 'E'),
    ...bifBranches(sp, bif),
    ...hearkenBack(sp, X),
    // Product (mint, ongoing): trunks start abruptly at Hearken and run on to Aspada.
    [`${P_}product-mgmt-1`]: trunk(X['hearken']!, X['aspada']!, 'H'),
    [`${P_}economics-1`]: trunk(X['hearken']!, X['aspada']!, 'I'),
    [`${P_}fundraising-1`]: trunk(X['hearken']!, X['aspada']!, 'J'),
    // Leadership (raspberry): K (Team, ongoing) runs PBP to Aspada; L (Evangelism) runs OpenNews to
    // Washington Post, where it continues as its Lighthouse branch.
    [`${L_}team-1`]: trunk(X['palm-beach-post']!, X['aspada']!, 'K'),
    [`${L_}evangelism-1`]: trunk(X['opennews']!, wapo, 'L'),
    // Investing (ink, ongoing): M (Diligence) and N (Advisory) start abruptly at LightRock India, stop at Aspada
    // and run on dashed off the east edge.
    ['investing-diligence-1']: trunk(X['lightrock-india']!, X['aspada']!, 'M'),
    ['investing-advisory-1']: trunk(X['lightrock-india']!, X['aspada']!, 'N'),
    ...fanDown(sp, sg, X['seattle-globalist']!, 'seattle-globalist'),
    ...fanDown(sp, [...ats, ...atsP], X['all-things-small']!, 'all-things-small'),
    ...bifBranches(sp, uw, sp.uwK0, 'uw-lecturer'),
    ...fanDownThenEast(sp, X, lh, X['lighthouse-reports']!, 'lighthouse-reports'),
  };

  X['bad-idea-factory'] = sp.k0 - sp.upTurn + P; // slot only: label and order; dots are placed explicitly
  const stations: Record<string, StationLayout> = {};
  for (const [id, x] of Object.entries(X)) stations[id] = { slot: x / GAP, labelSide: sides[id] ?? 'before' };
  // Desktop: Vox Media's label always wraps, so it clears OpenNews (moved east 1.5 lw) and Bad Idea Factory's rising branches.
  stations['vox-media']!.hWrap = true;
  // Phone: Bad Idea Factory's and All Things Small's labels wrap by the frame's width, not the canvas's; at the lw
  // floor the wider canvas unwrapped them and they ran off its west and east edges.
  stations['bad-idea-factory']!.vFrameWrap = true;
  stations['all-things-small']!.vFrameWrap = true;
  // Phone: the Uni. of Washington label always wraps (Uni. of / Washington); on one line it reaches the A and B legs.
  stations['uw-lecturer']!.vWrap = true;
  // Phone: the All Things Small label goes under its dots, clear of the fan's bends above them.
  stations['all-things-small']!.vUnder = true;
  // Phone: the Seattle Globalist label goes above its dots; under them it would touch All Things Small's.
  stations['seattle-globalist']!.vOver = true;
  // Phone: these labels stay east of the Seattle Globalist fan's outer bend and of the J trunk.
  stations['seattle-globalist']!.vMinLane = BOTTOM + sp.drop + 2 * (DIAG - P) + 1;
  stations['lighthouse-reports']!.vMinLane = BOTTOM + 1;
  return { stations, tracks };
}

export const careerLayout: LineLayout = {
  lineId: 'journalism',
  lineIds: ['journalism', 'code', 'leadership', 'investing', 'product'], // key order follows the ribbon, top to bottom
  slotGap: { horizontal: GAP, vertical: GAP },
  minLw: 11, // desktop floor (rule 22): below 12 so nothing clips just above the switch
  // Switch point (rule 22, ORDER 28): the smallest horizontal fit lw at which the rule 29 gaps
  // (Medill / Palm Beach Post, Palm Beach Post / OpenNews, OpenNews / Vox Media) are at least 1 lw.
  // Measured: Palm Beach Post / OpenNews binds and reaches 1 lw at a fit of about 11.783 lw.
  // Labels are fixed px, so re-measure if label text, label size or station spacing changes.
  hSwitchLw: 11.79,
  ...build(DESKTOP),
  discs: [],
};
/** The vertical (phone) layout: same stations and order, R1 and R3 without the desktop's extra height. */
careerLayout.vertical = { ...careerLayout, ...build(PHONE) };
