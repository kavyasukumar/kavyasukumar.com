// Terminals (rule 26), per track: a track that truly ends at a stop (not ongoing, and no branch of
// it carries on past the stop) gets a square dot and ends at the square's centre, with no overrun. At a
// mixed stop only those tracks get squares; the rest keep circles. A track that ends while a branch
// split off it runs on (e.g. the trunks at Washington Post) keeps its circle. A pure terminal is a
// stop where every track truly ends.
import { laneAt } from './geometry';
import type { LineLayout, MapTrack } from './types';

/** Slot of a track's last stop. */
function lastSlot(t: MapTrack, layout: LineLayout): number {
  const last = t.stations[t.stations.length - 1]!;
  return layout.tracks[t.id]?.stops?.[last]?.slot ?? layout.stations[last]?.slot ?? -Infinity;
}

/**
 * True if branch `b` carries track `t` on past the stop: it leaves t at the stop (its route starts
 * there, as the Lighthouse branches start where the trunks end at Washington Post) and is ongoing or
 * stops later. A branch that left t at an earlier stop (code F's Lighthouse branch, which leaves at
 * Washington Post, seen from LightRock India) is its own track and does not.
 */
function carriesOn(b: MapTrack, slot: number, layout: LineLayout): boolean {
  const start = layout.tracks[b.id]?.route[0];
  return !!start && start.slot >= slot - 1e-6 && (b.ongoing || lastSlot(b, layout) > slot);
}

/** True if `b`'s route starts on track `on`'s route. */
function startsOn(b: MapTrack, on: MapTrack, layout: LineLayout): boolean {
  const start = layout.tracks[b.id]?.route[0];
  const route = layout.tracks[on.id]?.route;
  if (!start || !route) return false;
  const lane = laneAt(route, start.slot);
  return lane !== null && Math.abs(lane - start.lane) < 1e-6;
}

/**
 * True if `b` splits off `t`: its route starts on t's route. Not when both start on a third track
 * of the theme (siblings off one trunk whose departure stubs overlap, e.g. the L gigs at SG and UW).
 */
function branchOf(b: MapTrack, t: MapTrack, layout: LineLayout, all: MapTrack[]): boolean {
  if (b.id === t.id || b.theme !== t.theme || !startsOn(b, t, layout)) return false;
  return !all.some((p) => p.id !== b.id && p.id !== t.id && p.theme === t.theme && startsOn(b, p, layout) && startsOn(t, p, layout));
}

/** True if this one track truly ends at the stop: not ongoing, its last stop, and no branch carries it on past. */
export function endsHere(stationId: string, slot: number, t: MapTrack, all: MapTrack[], layout: LineLayout): boolean {
  return !t.ongoing && t.stations[t.stations.length - 1] === stationId &&
    !all.some((b) => branchOf(b, t, layout, all) && carriesOn(b, slot, layout));
}

/** True if every track at the stop truly ends there. */
export function isPureTerminal(stationId: string, slot: number, here: MapTrack[], all: MapTrack[], layout: LineLayout): boolean {
  return here.length > 0 && here.every((t) => endsHere(stationId, slot, t, all, layout));
}
