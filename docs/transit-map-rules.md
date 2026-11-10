# Transit map rules

Rules for the career transit map on the dataviz page. The map is redrawn from scratch against these rules.

Rules 1–8 are the core rules and were set by the map's owner. Rules 9 and on are derived from three reference maps and are proposals until approved:

- **NYC72**: the 1972 Vignelli New York subway map.
- **NYC08**: the 2008 Vignelli-style New York subway map.
- **LON**: the London Underground map (Beck tradition).

All sizes are in **lw**, one line width (the width of a single track).

## Vocabulary

- **Line**: one colour. A line is a facet of the career, such as code, journalism or investing.
- **Track**: one strand of a line. A line can have more than one track, each with its own theme. For example, the code line has "for the love of code" and "code as a tool for social justice".
- **Bundle (ribbon)**: two or more tracks that run side by side between the same stops.
- **Stop**: any place on the map where a track stops to let people on or off. A stop is a station, a terminal or an interchange (rule 7).

## Core rules

1. Each line is one colour and represents a facet, such as code, journalism or investing.
2. A line may have more than one track. Tracks of the same colour are called tracks, not lines.
3. When a station has more than one track, those tracks stay next to each other.
4. The layout minimises overlaps and crossings.
5. A track cannot split. It can turn. Tracks can come together into a bundle and move apart again, and a new track can be wedged into a bundle at an interchange. That is not a split, because every track stays one unbroken strand with its own identity.
6. A track can turn 45° or 90°, in any direction.
7. A stop is one of three kinds:
   - **Station**: one track passes through it.
   - **Terminal**: one track stops there. It is the end of that track.
   - **Interchange**: two or more tracks go to it, whether the tracks are the same colour or different colours.
8. Where tracks overlap or cross, one group stays on top. Which group is an open decision (see Open decisions): the tracks going straight, or the tracks turning. Whichever is chosen, apply it consistently. At a given turn, either every straight-through track is on top of every turning track, or every turning track is on top of every straight-through track. Never mix the two at the same turn.

## Derived rules

### Bundles and spacing

9. **Tracks that share a corridor form a bundle.** Draw them parallel and keep their left-to-right order along the whole shared stretch. Tracks never swap places inside a bundle. [NYC08, LON]
10. **Tracks of the same colour touch, split by a hairline of background colour.** The hairline is about 0.12 lw, so the track pitch is about 1.12 lw. [NYC08, LON]
11. **Tracks of different colours sit at the same hairline as tracks of one colour.** There is one uniform pitch of about 1.12 lw everywhere, with no wider gap between colours. Colour separates the lines. [NYC full map, NYC08, LON]
12. **Every line is the same width everywhere**, in flat colour with no gradients. [NYC72, NYC08, LON]

### Angles and turns

13. **Use only 0°, 45° and 90° for tracks, connectors and label baselines** (labels stay at 0°). This is rule 6 applied to everything on the map. [NYC72, NYC08, LON]
14. **A bundle turns in concentric arcs that share one centre.** The inner track has a radius of about 1.5 lw and each next track adds one track pitch. Track order and the gap between tracks are the same through the turn. [NYC08, LON]
15. **Round every bend. Never put a stop on a bend.** Leave a straight run of at least 1.5 lw before and after each arc. [NYC08, LON]
16. **Use 45° runs for long moves only.** A 45° run is at least about 10 lw long. A short sideways shift is a 45° jog of about 2–4 lw. [NYC08]
17. **Each track bends rarely.** Change direction to reach a corridor or an interchange, then hold that direction for a long run. Aim for at most one bend per three stops, and count bends per track as a check. [LON]

### Crossings and branches

18. **Tracks cross at 90° or 45° only.** A crossing never sits on, or within about 2.5 lw of, a stop that the crossing track does not serve. The layering follows rule 8. [LON, NYC08]
19. **Show a crossing plainly.** There is no bridge symbol and no dot. The top track gets a casing of background colour about 0.25 lw wide on each side. [NYC08, LON]
20. **Show a branch as separate tracks that join and leave a bundle.** Each branch is its own track. It rides in the bundle while the path is shared, then peels off with a 45° bend. Put it on the side of the bundle it leaves toward, so it never crosses its sibling. The bend sits at least about 2 lw from the nearest stop. This keeps rule 5. [LON]
21. **Wedge a new track into a bundle at an interchange.** The joining track arrives with a concentric turn (rule 14), takes its place next to its neighbours with the same-colour hairline (rule 10), and the stop where it joins is an interchange with a dot for every track in the bundle. The bundle keeps its track order, so the new track goes on the side it came from. The same applies in reverse when a track leaves. Tracks of one colour may also arrive from different directions and merge into one bundle, as the 4 and 5 do at 149 St. [NYC08, NYC full map]

### Stops

22. **Every track that stops gets its own dot, centred on that track.** The dot is black and about 1 lw across, the same as the track width, and never wider than the track. It carries the track's ID in white: a short letter or number that is unique to that track. Same-colour tracks are told apart by their dots. [NYC08, NYC full map]
23. **A track that skips a stop passes with no mark** (no dot, no gap, no change of width). Only the tracks that stop get dots. [NYC08, LON]
24. **An interchange is a set of dots, one per track, joined by a thin dark connector.** The connector is about 0.12–0.15 lw thick and follows 0°, 45° or 90°. Where the dots touch inside one bundle, no connector is needed. It joins separate bundles when the dots cannot touch. [NYC08, NYC72]
25. **The dots of an interchange do not have to sit on one straight line.** Each dot stays centred on its own track, wherever that track is. The tracks of an interchange may be on different horizontals, verticals or diagonals, and may approach from different directions. The connector bends to follow them, along 0°, 45° or 90°, with rounded corners. It can be straight, L-shaped or U-shaped, and it never crosses a track it does not serve. Dots that touch stay touching. For example, B and D stack vertically with the 4 offset to the side, and the 4 and 5 are joined by a U-shaped connector under the 2. [NYC full map]
26. **A terminal ends square and carries an ID disc.** The track stops about 0.3–1 lw past its last dot, with no ring, bar or arrow on the track itself. Just past the end sits a large disc in the line colour, about 2 lw across, with the track's ID in white. The disc is offset so it clears the label. Where several tracks end together, their discs stack. If a terminal is also an interchange, it also follows rules 24 and 25. [NYC08, NYC full map]
27. **Space stops evenly within a straight run.** Do not space by true time. Typical gap about 12 lw, minimum about 8 lw. Within one run, gaps vary by 25% or less. Dense areas may take about 20 lw to leave room for labels. [LON]

### Labels

28. **Labels are horizontal and sit on the same side along a straight run.** They switch side only at a bend or to avoid a collision. A label never crosses a track, a dot or another label. [LON, NYC08]
29. **A label starts about 0.5–1 lw past the outer edge of the bundle.** It goes on the side away from the nearest parallel line. Long names stack on two or three lines, flush toward the line. [NYC08, LON]
30. **Weight labels by role.** Interchange and terminal labels are bold and dark. Plain stations are regular weight and a lighter grey. [NYC08, NYC72]

### Legend

The London map has a "Key to lines" and a "Key to symbols" outside the map frame. These rules come from them.

31. **Include a key to lines.** One entry per line: a short horizontal swatch drawn at the map's line width, in the line's colour, with the line's name beside it. Keep the entry order the same every time. [LON]
32. **List the tracks under their line in the key.** Each track gets its own name and its ID (rule 22), so a reader can tell which track is which. London does not do this, so it is an addition of ours. The tracks follow rule 10 and sit touching in the key swatch. [new]
33. **Include a key to symbols.** Show every kind of stop exactly as it is drawn on the map, with a text label each: station, terminal, interchange, and the linked interchange if one is used. The symbols in the key are the same size as on the map. [LON]
34. **Use a different swatch style for a different kind of service, and explain it in the key.** London draws a dashed swatch for a limited service (District at weekends and holidays, Thameslink) and a double thin line for non-Tube modes (DLR, Overground), each with a one-line note under the name. If we need this (for example, a side hustle that ran only part-time), use a dashed track and add a note. [LON]
35. **Lay out the key as a left-aligned column.** Swatches or symbols sit in one column, and names sit at one fixed offset beside them. Group related entries under a short heading, and separate groups with a hairline rule. The key uses the same typeface as the map labels and sits outside the map frame. [LON]

## Open decisions

- **Layering at turns (rule 8):** straight-through tracks on top (the rule as first written), or turning tracks on top (what NYC does). Undecided. The Tube avoids layering by drawing bundles side by side.
- **Linked interchange circles (rule 24):** London also draws a capsule for a short walk between stations. Not adopted.
- **Telling tracks of one line apart (rules 10, 32):** London tells services apart with line style (single, double, dashed) and NYC with route letters on each track. We rely on order and the hairline, plus names in the key. Whether to add letters on the tracks or a swatch style is undecided.
- **Dashed tracks (rule 34):** whether any track is drawn dashed for part-time or paused work. Undecided.
- The name and theme of each track within a line, and which stops each track serves.
