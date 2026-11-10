// Where the track tooltip goes (trackbar.ts). It sits OFFSET px right of and
// below the pointer; if that would cross the viewport's right or bottom edge
// (less EDGE px), it flips to the left of and/or above the pointer instead.
// Last resort, it is clamped inside the viewport. `w`/`h` are its full
// footprint, shadow included. Returns the top-left corner in viewport px.

const OFFSET = 16;
const EDGE = 8;

export function tipPos(px: number, py: number, w: number, h: number, vw: number, vh: number): { x: number; y: number } {
  let x = px + OFFSET;
  if (x + w > vw - EDGE) x = px - OFFSET - w;
  let y = py + OFFSET;
  if (y + h > vh - EDGE) y = py - OFFSET - h;
  x = Math.max(EDGE, Math.min(x, vw - EDGE - w));
  y = Math.max(EDGE, Math.min(y, vh - EDGE - h));
  return { x: Math.round(x), y: Math.round(y) };
}
