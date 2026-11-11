export type Orientation = 'horizontal' | 'vertical';

/** A point in layout space: slot = station slot index along time, lane = offset across time in lw. */
export interface LayoutPoint { slot: number; lane: number }

export interface TrackLayout {
  /** Centreline. First and last points are the track's first and last stop. For ongoing tracks the renderer extends the last segment to the canvas edge. */
  route: LayoutPoint[];
  /** Optional corner radius in lw for each interior route point (concentric bends, rule 14). Default 1.5. */
  radii?: number[];
  /** Straight-through track: drawn on top at crossings, with a casing (rules 8, 19). */
  top?: boolean;
  /** Drawn beneath everything (own layer) and crossed by the tracks in `over`, which get a casing over it. */
  low?: boolean;
  /** Ids of `low` tracks this track passes over, with the usual crossing casing. */
  over?: string[];
  /** Explicit dot positions by station id, for stops off the slot line (J-curve tips, drops; rule 25). */
  stops?: Record<string, LayoutPoint>;
}

export interface DiscLayout {
  trackId: string;
  slot: number;
  /** Offset along time in lw from slot * slotGap. */
  dt: number;
  lane: number;
}

export interface StationLayout {
  slot: number;
  /**
   * 'before' = smaller lane side (above in horizontal, left in vertical); 'after' = larger lane side.
   * 'tip' = past the dots in the direction of travel of a J-curve leg running toward larger lanes (rule 20).
   * 'back' = beside the dots on the earlier-slot side (left in horizontal, above in vertical).
   */
  labelSide: 'before' | 'after' | 'tip' | 'back';
  /** Horizontal layout only: the label always wraps to two lines, to keep clear of its neighbours (Vox Media). */
  hWrap?: boolean;
  /**
   * Vertical layout only: the label's wrap budget comes from the frame width, not the canvas width. At the lw
   * floor the canvas grows past the frame (it scrolls), and the layout is measured at the frame width, so a
   * label measured wrapped could otherwise draw on one line and run off the canvas (Bad Idea Factory, All Things Small).
   */
  vFrameWrap?: boolean;
  /** Vertical layout only: the label always wraps to two lines (Uni. of Washington; on one line it reaches the A and B legs). */
  vWrap?: boolean;
  /** Vertical layout only: a 'back' label goes under the dots instead of above them, clear of the fan's bends. */
  vUnder?: boolean;
  /** Vertical layout only: a 'tip' label goes above the dots instead of under them (Seattle Globalist, clear of ATS). */
  vOver?: boolean;
  /** Vertical layout only: lane west of which a 'tip' label above or under the dots may not reach. */
  vMinLane?: number;
}

export interface LineLayout {
  lineId: string;
  /** All lines drawn by this layout (default: just lineId). Track colour comes from its theme's line. */
  lineIds?: string[];
  /** Smallest lw in px (default 16, rule 22): the desktop floor. The map switches to vertical below it, or below hSwitchLw when that is higher. */
  minLw?: number;
  /**
   * Horizontal fit lw below which the map switches to vertical (rule 22), when above minLw: the
   * smallest fit lw at which the rule 29 label gaps hold at 1 lw. Default: minLw.
   */
  hSwitchLw?: number;
  /** lw between adjacent slots, per orientation. */
  slotGap: Record<Orientation, number>;
  stations: Record<string, StationLayout>;
  tracks: Record<string, TrackLayout>;
  discs: DiscLayout[];
  /** Layout used when the map draws vertically (phone), when its spacing differs from the horizontal one. */
  vertical?: LineLayout;
}

/**
 * A track's ID: one capital letter, in ribbon order top to bottom (owner decision, ORDER 17).
 * Journalism A B C, code D E F G, product H I J, leadership K L, investing M N.
 */
export type TrackLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N';
/** Track letters in ribbon (and key) order. */
export const TRACK_LETTERS: readonly TrackLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];

export interface MapLine { id: string; name: string; order: number; colour: string }
export interface MapTheme { id: string; line: string; name: string; short: string; theme: string; ongoing: boolean; letter: TrackLetter; strand_count: number }
export interface MapTrack { id: string; theme: string; label: TrackLetter; hatched: boolean; stations: string[]; ongoing: boolean }
export interface MapStation { id: string; order: number; name: string; start: number; end: number | null; ongoing: boolean; lines: string[]; themes: string[]; tracks: string[]; part_time: boolean }
export interface MapData { lines: MapLine[]; themes: MapTheme[]; tracks: MapTrack[]; stations: MapStation[] }

export interface Scale {
  orientation: Orientation;
  /** Pixels per lw. */
  lw: number;
  /** lw per slot for this orientation. */
  slotGap: number;
  /** Pixel position of (slot 0, lane 0). */
  originX: number;
  originY: number;
}
