import type { LayoutPoint, Scale } from './types';

export const PITCH = 1.12;
export const DOT_D = 1;
export const DISC_D = 2;
export const END_OVERRUN = 0.6;

export function toXY(slot: number, lane: number, s: Scale): [number, number] {
  const along = slot * s.slotGap * s.lw;
  const across = lane * s.lw;
  return s.orientation === 'horizontal'
    ? [s.originX + along, s.originY + across]
    : [s.originX + across, s.originY + along];
}

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

export function roundedPath(points: [number, number][], radius: number): string {
  const first = points[0];
  if (!first) return '';
  let d = `M${fmt(first[0])},${fmt(first[1])}`;
  for (let i = 1; i < points.length; i++) {
    const cur = points[i] as [number, number];
    const prev = points[i - 1] as [number, number];
    const next = points[i + 1];
    if (!next) {
      d += `L${fmt(cur[0])},${fmt(cur[1])}`;
      break;
    }
    const v1: [number, number] = [prev[0] - cur[0], prev[1] - cur[1]];
    const v2: [number, number] = [next[0] - cur[0], next[1] - cur[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    if (l1 === 0 || l2 === 0) {
      d += `L${fmt(cur[0])},${fmt(cur[1])}`;
      continue;
    }
    const u1: [number, number] = [v1[0] / l1, v1[1] / l1];
    const u2: [number, number] = [v2[0] / l2, v2[1] / l2];
    const cross = u1[0] * u2[1] - u1[1] * u2[0];
    const dot = Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1]));
    if (Math.abs(cross) < 1e-9) {
      // collinear: no corner
      d += `L${fmt(cur[0])},${fmt(cur[1])}`;
      continue;
    }
    const theta = Math.acos(dot); // interior angle between segments
    let t = radius / Math.tan(theta / 2); // tangent length
    const maxT = Math.min(l1, l2) / (i > 1 ? 2 : 1) ;
    let r = radius;
    if (t > maxT) {
      r = radius * (maxT / t);
      t = maxT;
    }
    const a: [number, number] = [cur[0] + u1[0] * t, cur[1] + u1[1] * t];
    const b: [number, number] = [cur[0] + u2[0] * t, cur[1] + u2[1] * t];
    const sweep = cross < 0 ? 1 : 0;
    d += `L${fmt(a[0])},${fmt(a[1])}A${fmt(r)},${fmt(r)} 0 0 ${sweep} ${fmt(b[0])},${fmt(b[1])}`;
  }
  return d;
}

export function laneAt(route: LayoutPoint[], slot: number): number | null {
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i] as LayoutPoint;
    const b = route[i + 1] as LayoutPoint;
    const lo = Math.min(a.slot, b.slot);
    const hi = Math.max(a.slot, b.slot);
    if (slot < lo || slot > hi) continue;
    if (a.slot === b.slot) return a.lane;
    return a.lane + ((slot - a.slot) / (b.slot - a.slot)) * (b.lane - a.lane);
  }
  const only = route[0];
  if (route.length === 1 && only && only.slot === slot) return only.lane;
  return null;
}
