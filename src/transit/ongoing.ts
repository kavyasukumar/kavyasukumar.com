// Ongoing work (rule 27): a branch that is still running is solid to just past its last stop,
// then runs on dashed, in its direction of travel, off the edge of the map canvas. No TODAY
// label and no end mark.

type Pt = [number, number];

/** Dash pattern in lw: 1 lw dash, 0.5 lw gap, butt caps (owner decision). */
export const DASH = 1;
export const DASH_GAP = 0.5;
/** While measuring the canvas, the dashed run reserves this many lw past its last stop. */
const RESERVE = 2;

/** Distance along unit direction `l` from `p` to the first canvas edge it meets. */
function toEdge(p: Pt, l: Pt, W: number, H: number): number {
  let t = Infinity;
  if (l[0] > 1e-3) t = Math.min(t, (W - p[0]) / l[0]);
  if (l[0] < -1e-3) t = Math.min(t, -p[0] / l[0]);
  if (l[1] > 1e-3) t = Math.min(t, (H - p[1]) / l[1]);
  if (l[1] < -1e-3) t = Math.min(t, -p[1] / l[1]);
  return Number.isFinite(t) ? Math.max(0, t) : 0;
}

/**
 * The dashed continuation of an ongoing track whose solid part ends at `solidEnd`, heading `l`.
 * It starts one gap past the solid end, so the pattern reads solid, gap, dash, gap, ...
 * With H === 0 (measuring) it reserves a short run; otherwise it runs to the canvas edge.
 */
export function dashedRun(solidEnd: Pt, l: Pt, lw: number, W: number, H: number): { from: Pt; to: Pt; d: string; dash: string } {
  const from: Pt = [solidEnd[0] + l[0] * DASH_GAP * lw, solidEnd[1] + l[1] * DASH_GAP * lw];
  const t = H === 0 ? RESERVE * lw : toEdge(from, l, W, H);
  const to: Pt = [from[0] + l[0] * t, from[1] + l[1] * t];
  const f = (n: number): string => String(Math.round(n * 1000) / 1000);
  return { from, to, d: `M${f(from[0])},${f(from[1])}L${f(to[0])},${f(to[1])}`, dash: `${f(DASH * lw)} ${f(DASH_GAP * lw)}` };
}
