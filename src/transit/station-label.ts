import { DISC_D, DOT_D, END_OVERRUN, laneAt, toXY } from './geometry';
import { CHAR_W, LINE_H, placeLabel, wrap, type ScreenDir } from './labels';
import type { StationModel } from './model';
import type { LineLayout, Scale } from './types';

const LABEL_GAP = 0.75;
const LABEL_GAP_H = 1.44; // horizontal (desktop) only: about 44% more room between the ribbon and its label band (R2, twice +20%)

/** Where a station's name goes: its wrapped lines, anchor point and bounding box (rules 20, 29, 30). */
export function stationLabel(sm: StationModel, layout: LineLayout, s: Scale, budget: number, frameBudget = budget):
  { lines: string[]; x: number; y: number; anchor: string; box: [number, number, number, number] } {
  const { lw } = s;
  const horiz = s.orientation === 'horizontal';
  const own = layout.stations[sm.st.id];
  const lines = wrap(sm.st.name, horiz ? (own?.hWrap ? 0 : budget)
    : own?.vWrap ? 0 : own?.vFrameWrap ? Math.min(budget, frameBudget) : budget);
  const n = lines.length;
  const wpx = Math.max(...lines.map((x) => x.length * CHAR_W));
  const side = sm.labelSide;
  let ex: number; let ey: number; let dir: ScreenDir;
  if (side === 'tip' || side === 'back') {
    const mean = (f: (d: StationModel['dots'][number]) => number): number => sm.dots.reduce((a, d) => a + f(d), 0) / sm.dots.length;
    const legRoute = layout.tracks[sm.dots[0]!.track.id]!.route;
    const alongSlot = legRoute.length > 1 && legRoute[legRoute.length - 1]!.lane === legRoute[legRoute.length - 2]!.lane;
    if (side === 'tip' && alongSlot) {
      // Leg runs along time (east, or south in vertical): label past the track end, centred (rule 20).
      // At a pure terminal that is the squares' edge (rule 26).
      const end = sm.square ? Math.max(...sm.dots.map((d) => d.slot)) + DOT_D / 2 / s.slotGap
        : Math.max(...legRoute.map((p) => p.slot)) + END_OVERRUN / s.slotGap;
      [ex, ey] = toXY(end, mean((d) => d.lane), s);
      dir = horiz ? 'right' : 'down';
    } else if (side === 'tip' && !horiz && legRoute[legRoute.length - 1]!.lane < legRoute[legRoute.length - 2]!.lane) {
      // Vertical layout, west leg: label over the squares, centred, not past the tip, so the fan
      // can sit near the canvas's west edge on a phone (rules 20, 29; owner decision).
      [ex, ey] = toXY(Math.min(...sm.dots.map((d) => d.slot)) - DOT_D / 2 / s.slotGap, mean((d) => d.lane), s);
      dir = 'up';
    } else if (side === 'tip' && legRoute[legRoute.length - 1]!.lane < legRoute[legRoute.length - 2]!.lane) {
      // North leg: label past the squares' edge, above the dots (rule 20).
      const top = sm.minLane - DOT_D / 2 - (sm.square ? 0 : END_OVERRUN);
      [ex, ey] = toXY(mean((d) => d.slot), top, s);
      dir = horiz ? 'up' : 'left';
    } else if (side === 'tip') {
      // J-curve tip: past the dot and the track end, in the leg's direction (rule 20).
      const tip = sm.maxLane + DOT_D / 2 + (sm.square ? 0 : END_OVERRUN);
      const mid = mean((d) => d.slot);
      // Vertical layout: the label sits under the dots, so it never crosses a track or runs
      // off a phone-width canvas past the tip (rules 20, 29).
      // vOver: above the dots instead, where the next fan's dots leave no room under them.
      if (!horiz) {
        const over = !!layout.stations[sm.st.id]?.vOver;
        const end = over ? Math.min(...sm.dots.map((d) => d.slot)) - DOT_D / 2 / s.slotGap
          : Math.max(...sm.dots.map((d) => d.slot)) + DOT_D / 2 / s.slotGap;
        [ex, ey] = toXY(end, mean((d) => d.lane), s);
        dir = over ? 'up' : 'down';

      } else {
        [ex, ey] = toXY(mid, tip, s);
        dir = horiz ? 'down' : 'right';
      }
    } else {
      const under = !horiz && !!layout.stations[sm.st.id]?.vUnder;
      const first = under ? Math.max(...sm.dots.map((d) => d.slot)) + DOT_D / 2 / s.slotGap
        : Math.min(...sm.dots.map((d) => d.slot)) - DOT_D / 2 / s.slotGap;
      [ex, ey] = toXY(first, mean((d) => d.lane), s);
      dir = horiz ? 'left' : under ? 'down' : 'up';
      // Vertical: flush the label's right edge with the dots, away from the branches' bend (rule 30).
      if (!horiz) ex -= Math.max(0, wpx / 2 - (DOT_D * lw) / 2);
    }
    // vMinLane: a wide label never reaches back west of this lane, over the trunks or bends there
    // (owner call: Lighthouse Reports touched J at ~600 px).
    const minLane = layout.stations[sm.st.id]?.vMinLane;
    if (!horiz && minLane !== undefined && (dir === 'up' || dir === 'down')) ex = Math.max(ex, toXY(0, minLane, s)[0] + wpx / 2);
  } else {
    // Start just past this station's dots, then step past any track or disc in the
    // way. The label may sit in a gap between bands when it fits there (rules 29, 30).
    const before = side === 'before';
    const needPx = horiz ? n * LINE_H + 2 * LABEL_GAP * lw : wpx + 2 * LABEL_GAP * lw;
    const need = needPx / lw;
    const obstacles: [number, number][] = [];
    for (const tl of Object.values(layout.tracks)) {
      const ln = laneAt(tl.route, sm.slot);
      if (ln !== null) obstacles.push([ln - DOT_D / 2, ln + DOT_D / 2]);
    }
    for (const d of layout.discs) {
      if (d.slot === sm.slot) obstacles.push([d.lane - DISC_D / 2, d.lane + DISC_D / 2]);
    }
    let edge = before ? sm.minLane - DOT_D / 2 : sm.maxLane + DOT_D / 2;
    for (let moved = true; moved;) {
      moved = false;
      for (const [lo, hi] of obstacles) {
        const blocks = before ? lo < edge && hi > edge - need : hi > edge && lo < edge + need;
        if (!blocks) continue;
        const next = before ? Math.min(edge, lo) : Math.max(edge, hi);
        if (next !== edge) { edge = next; moved = true; }
      }
    }
    [ex, ey] = toXY(sm.slot, edge, s);
    dir = horiz ? (before ? 'up' : 'down') : (before ? 'left' : 'right');
  }
  return { lines, ...placeLabel(dir, ex, ey, LABEL_GAP * (horiz ? LABEL_GAP_H : 1) * lw, lines) };
}
