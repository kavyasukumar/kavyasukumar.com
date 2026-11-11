import { laneAt } from './geometry';
import { endsHere as trackEndsHere, isPureTerminal } from './terminals';
import type { LineLayout, MapData, MapLine, MapStation, MapTrack, StationLayout } from './types';

/** The map's data joined to its layout: tracks drawn, and each station's dots in lane order. */
export interface StationModel {
  st: MapStation;
  slot: number;
  labelSide: StationLayout['labelSide'];
  /** square: this track truly ends here (rule 26, per track), so its dot is a square and the track stops at it. */
  dots: { track: MapTrack; lane: number; slot: number; square: boolean }[];
  minLane: number;
  maxLane: number;
  kind: 'station' | 'interchange' | 'terminal';
  /** Pure terminal (rule 26): every track ends here, so the dots are squares and the tracks stop at them. */
  square: boolean;
  themes: string[];
}
export interface Model { line: MapLine; colours: Record<string, string>; tracks: MapTrack[]; stations: StationModel[] }

export function yearsOf(st: MapStation): string {
  if (st.end === null) return `${st.start}–now`;
  if (st.end === st.start) return `${st.start}`;
  const same = Math.floor(st.start / 100) === Math.floor(st.end / 100);
  return `${st.start}–${same ? String(st.end).slice(2) : st.end}`;
}

export function buildModel(data: MapData, layout: LineLayout): Model {
  const line = data.lines.find((l) => l.id === layout.lineId);
  if (!line) throw new Error(`Unknown line ${layout.lineId}`);
  const lineIds = layout.lineIds ?? [line.id];
  const colours: Record<string, string> = {};
  for (const th of data.themes) {
    const l = data.lines.find((x) => x.id === th.line);
    if (l && lineIds.includes(l.id)) colours[th.id] = l.colour;
  }
  const themeIds = new Set(Object.keys(colours));
  const tracks = data.tracks.filter((t) => themeIds.has(t.theme) && layout.tracks[t.id]);
  const stations: StationModel[] = [];
  for (const st of data.stations) {
    const sl = layout.stations[st.id];
    if (!sl || !st.lines.some((l) => lineIds.includes(l))) continue;
    const dots: StationModel['dots'] = [];
    const sq = (track: MapTrack): boolean => trackEndsHere(st.id, sl.slot, track, tracks, layout);
    for (const track of tracks) {
      if (!track.stations.includes(st.id)) continue;
      const tl = layout.tracks[track.id]!;
      const at = tl.stops?.[st.id];
      if (at) { dots.push({ track, lane: at.lane, slot: at.slot, square: sq(track) }); continue; }
      const lane = laneAt(tl.route, sl.slot);
      if (lane !== null) dots.push({ track, lane, slot: sl.slot, square: sq(track) });
    }
    if (!dots.length) continue;
    dots.sort((a, b) => a.lane - b.lane || a.slot - b.slot);
    const endsHere = dots.some((d) => !d.track.ongoing && d.track.stations[d.track.stations.length - 1] === st.id);
    const themes: string[] = [];
    for (const d of dots) {
      const th = data.themes.find((t) => t.id === d.track.theme);
      if (th && !themes.includes(th.short)) themes.push(th.short);
    }
    stations.push({
      st, slot: sl.slot, labelSide: sl.labelSide, dots, themes,
      minLane: dots[0]!.lane, maxLane: dots[dots.length - 1]!.lane,
      kind: dots.length >= 2 ? 'interchange' : endsHere ? 'terminal' : 'station',
      square: isPureTerminal(st.id, sl.slot, dots.map((d) => d.track), tracks, layout),
    });
  }
  stations.sort((a, b) => a.slot - b.slot);
  return { line, colours, tracks, stations };
}
