// Pure terminals (rule 26): stops where every track at the stop ends. Their dots are squares and
// their tracks end at the square's centre, with no overrun. A stop where a track ends while a
// branch split off it runs on past the stop (e.g. Washington Post) is mixed and keeps circles.
import { laneAt } from './geometry';
import type { LineLayout, MapTrack } from './types';

/** Slot of a track's last stop. */
function lastSlot(t: MapTrack, layout: LineLayout): number {
  const last = t.stations[t.stations.length - 1]!;
  return layout.tracks[t.id]?.stops?.[last]?.slot ?? layout.stations[last]?.slot ?? -Infinity;
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

/** True if every track at the stop ends there and none has a branch running on past it. */
export function isPureTerminal(stationId: string, slot: number, here: MapTrack[], all: MapTrack[], layout: LineLayout): boolean {
  if (!here.length) return false;
  return here.every((t) => !t.ongoing && t.stations[t.stations.length - 1] === stationId &&
    !all.some((b) => branchOf(b, t, layout, all) && (b.ongoing || lastSlot(b, layout) > slot)));
}
