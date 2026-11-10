export type Orientation = 'horizontal' | 'vertical';

/** A point in layout space: slot = station slot index along time, lane = offset across time in lw. */
export interface LayoutPoint { slot: number; lane: number }

export interface TrackLayout {
  /** Centreline. First and last points are the track's first and last stop. For ongoing tracks the renderer extends the last segment to the canvas edge. */
  route: LayoutPoint[];
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
  /** 'before' = smaller lane side (above in horizontal, left in vertical); 'after' = larger lane side. */
  labelSide: 'before' | 'after';
}

export interface LineLayout {
  lineId: string;
  /** lw between adjacent slots, per orientation. */
  slotGap: Record<Orientation, number>;
  stations: Record<string, StationLayout>;
  tracks: Record<string, TrackLayout>;
  discs: DiscLayout[];
}

export interface MapLine { id: string; name: string; order: number; colour: string }
export interface MapTheme { id: string; line: string; name: string; short: string; theme: string; ongoing: boolean; num: number; strand_count: number }
export interface MapTrack { id: string; theme: string; label: string; hatched: boolean; stations: string[]; ongoing: boolean }
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
