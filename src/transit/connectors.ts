// Interchange connectors (rules 24, 25). Every interchange's dots are joined by a
// thin Ink line, centre to centre, even where the dots touch. Dots in one straight
// row get a straight line; dots off that row get 0°/90° elbows with rounded
// corners, choosing the elbow that does not cross a track the station does not serve.
import { DOT_D, laneAt, roundedPath, toXY } from './geometry';
import type { LayoutPoint, LineLayout, Scale } from './types';

/** Connector thickness in lw (rule 24: about 0.12-0.15 lw). */
export const CONNECTOR_W = 0.14;
const CORNER = 0.5; // lw

export interface ConnectorDot { trackId: string; slot: number; lane: number }
export interface Connector { key: string; d: string }

/** True if the layout-space segment a-b crosses or runs along a track not in `serves`. */
function blocked(a: LayoutPoint, b: LayoutPoint, serves: Set<string>, layout: LineLayout): boolean {
  for (const [id, tl] of Object.entries(layout.tracks)) {
    if (serves.has(id)) continue;
    if (a.slot === b.slot) {
      const ln = laneAt(tl.route, a.slot);
      const lo = Math.min(a.lane, b.lane); const hi = Math.max(a.lane, b.lane);
      if (ln !== null && ln > lo && ln < hi) return true;
      continue;
    }
    // Along time at a fixed lane: sample the track's lane over the span.
    const lo = Math.min(a.slot, b.slot); const hi = Math.max(a.slot, b.slot);
    for (let k = 0; k <= 16; k++) {
      const ln = laneAt(tl.route, lo + ((hi - lo) * k) / 16);
      if (ln !== null && Math.abs(ln - a.lane) < DOT_D / 2) return true;
    }
  }
  return false;
}

/** Layout-space waypoints from one dot to the next: straight, or an elbow (rule 25). */
function leg(a: LayoutPoint, b: LayoutPoint, serves: Set<string>, layout: LineLayout): LayoutPoint[] {
  if (a.slot === b.slot || a.lane === b.lane) return [b];
  const across: LayoutPoint = { slot: a.slot, lane: b.lane }; // move across time first
  const along: LayoutPoint = { slot: b.slot, lane: a.lane }; // move along time first
  const clear = (m: LayoutPoint) => !blocked(a, m, serves, layout) && !blocked(m, b, serves, layout);
  return [clear(across) || !clear(along) ? across : along, b];
}

/** The connector for one station, or null if it has fewer than two dots. */
export function connectorFor(stationId: string, dots: ConnectorDot[], layout: LineLayout, s: Scale): Connector | null {
  if (dots.length < 2) return null;
  const serves = new Set(dots.map((d) => d.trackId));
  const order = [...dots].sort((a, b) => a.lane - b.lane || a.slot - b.slot);
  const pts: LayoutPoint[] = [order[0]!];
  for (let i = 1; i < order.length; i++) pts.push(...leg(order[i - 1]!, order[i]!, serves, layout));
  const xy = pts.map((p) => toXY(p.slot, p.lane, s));
  return { key: stationId, d: roundedPath(xy, CORNER * s.lw) };
}
