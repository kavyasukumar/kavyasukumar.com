# Transit map rules

Rules for the career transit map on the dataviz page. The map is redrawn from scratch against these rules.

Rules 1–8 are the core rules and were set by the map's owner. Rules 9 and on are derived from three reference maps and are proposals until approved:

- **NYC72**: the 1972 Vignelli New York subway map.
- **NYC08**: the 2008 Vignelli-style New York subway map.
- **LON**: the London Underground map (Beck tradition).

All sizes are in **lw**, one line width (the width of a single track).

## Vocabulary

- **Line**: one colour. A line is a facet of the career, such as code, journalism or investing.
- **Track**: one theme of a line, drawn in the line's colour. A track and a theme are the same thing: a line can have more than one track, one per theme. For example, the code line has "for the love of code" and "code as a tool for social justice". A track is named and labelled by its theme number only (for example "5").
- **Theme**: a named thread of the career, such as "Leadership". It is the entry in the key (rule 33) and is exactly one track. Names of themes are working names.
- **Branch**: one arm of a track after it splits (rule 5). Where a theme's work runs in parallel, its track splits and each concurrent role gets its own branch, because a branch cannot be in two places at once. All branches of a track are still that one track: same number, same name.
- **Bundle (ribbon)**: two or more tracks that run side by side between the same stops.
- **Stop**: any place on the map where a track stops to let people on or off. A stop is a station, a terminal or an interchange (rule 7).
- **R1, R2, R3 (rows)**: reference names for the horizontal rows of the journalism layout. R1 (top) holds Bad Idea Factory: its branches leave the trunk just after Vox Media, rise north with concentric bends, stop at Bad Idea Factory (dots 5-6-7, the trunk's order) and run on north, dashed, off the top edge. R2 (middle) is the full-time trunk. R3 (bottom) holds the other short gigs: All Things Small and UW Lecturer as J-curves going south, and Lighthouse Reports going south-east then east. [owner decision] Names for discussion only; not a layout rule.

## Core rules

1. Each line is one colour and represents a facet, such as code, journalism or investing.
2. A line may have more than one track. Tracks of the same colour are called tracks, not lines. The branches of one track (rule 5) are still one track, not several.
3. When a station has more than one track, those tracks stay next to each other.
4. The layout minimises overlaps and crossings. Tracks of one line may cross where their splits require it, keeping crossings to a minimum; every crossing follows rules 8, 18 and 19. [owner decision]
5. A track may split into branches where its theme's work runs in parallel. It splits just after a stop, never on one, and each branch peels off with concentric bends (rule 14). Branches of one track never cross each other and never rejoin. A track can also turn, tracks can come together into a bundle and move apart again, and a new track can be wedged into a bundle at an interchange. [owner decision; replaces 'a track cannot split']
6. A track can turn 45° or 90°, in any direction.
7. A stop is one of three kinds:
   - **Station**: one track passes through it.
   - **Terminal**: one track stops there. It is the end of that track. Only work that has ended gets a terminal (rule 27).
   - **Interchange**: two or more tracks go to it, whether the tracks are the same colour or different colours.
8. Where tracks overlap or cross, the tracks going straight stay on top. This applies consistently: at a given turn, every straight-through track is on top of every turning track. The turning tracks are the ones cut by the casing (rule 19).

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

18. **Tracks cross at 90° or 45° only.** A crossing never sits on, or within about 2.5 lw of, a stop that the crossing track does not serve. The layering follows rule 8. This includes tracks of the same line: a branch that splits off one track may cross the other tracks of its line on its way out (rule 4). [LON, NYC08; owner decision for same-line crossings]
19. **Show a crossing plainly.** There is no bridge symbol and no dot. The top track gets a casing of background colour on each side, the same width as the hairline between parallel tracks (about 0.12 lw, rule 10). **Owner decision:** the casing equals the hairline, not 0.25 lw. A side that faces the outside of its bundle (no parallel neighbour one pitch away) gets no casing, and the casing only cuts the track being crossed. [NYC08, LON, owner decision]
20. **A branch is an arm of a split track.** It leaves its track just after a stop (rule 5) and peels off with concentric bends. Put it on the side of the track it leaves toward, so it never crosses a sibling branch. The bend sits at least about 2 lw from the nearest stop. [LON] **Owner decision:** part-time work branches off its track this way instead of starting abruptly. Gig branches leave the full-time trunk, never an ongoing part-time branch: for journalism, Lighthouse Reports' branches split off the trunk before Washington Post (where the trunk ends) and run on to Lighthouse, and no branch leaves Bad Idea Factory. **Owner decision:** Lighthouse Reports' branches leave the trunk heading south-east at 45°, lowest theme first, turn east with concentric bends and run straight to the Lighthouse stop on a run below the trunk; they never go above the trunk or loop over it. Its dots touch in a column on the east run, the tracks end square just past them, and its label sits right of the dots, vertically centred (south-running in the vertical layout: label under the dots). [owner decision] [owner decision] **Owner decision:** a single-stop branch (one that serves exactly one stop and ends there, such as All Things Small or UW Lecturer) is a J-curve, not an S-curve: it leaves its parent with one concentric bend and runs perpendicular to the parent, with no second bend back to parallel. Its terminal (rule 26) sits at the far end of the perpendicular leg, after a straight run of at least 1.5 lw past the arc (rule 15). Its label sits at the tip, in the direction of travel: under the dot for a leg running south, over it for north, right of it for east, left of it for west, 0.5–1 lw past the track end (rule 30). This holds in both layouts; in the vertical layout the legs run east or west. J-curves of one stop fan off a shared bundle as concentric bends, so the stop's dots touch. If two legs or their labels would collide, lengthen one leg or flip it to the other side. Multi-stop and ongoing branches keep their shape. Proposal: where a J-curve has to cross other tracks of its line to reach its leg, its 90° turn is drawn as two 45° arcs with the crossing on the 45° run between them (rule 18); in the vertical layout, a J-curve's tip label sits under its dots, so it never crosses a track or runs off a phone-width canvas (rule 29).
21. **Wedge a new track or branch into a bundle at an interchange.** A branch here is an arm of a split track (rule 20) and follows the same rule. The joining track arrives with a concentric turn (rule 14), takes its place next to its neighbours with the same-colour hairline (rule 10), and the stop where it joins is an interchange with a dot for every track in the bundle. The bundle keeps its track order, so the new track goes on the side it came from. The same applies in reverse when a track leaves. Tracks of one colour may also arrive from different directions and merge into one bundle, as the 4 and 5 do at 149 St. [NYC08, NYC full map]

### Stops

22. **Every track or branch that stops gets its own dot, centred on it.** The dot is black and about 1 lw across, the same as the track width, and never wider than the track. It carries the track's theme number in white, and nothing else (no letters): every dot on a track or any of its branches shows the same number. Same-colour tracks are told apart by their dots. [NYC08, NYC full map] **Owner decision:** the track width (lw) is set so the ID in a dot is at least 12px; on screen a track is never narrower than 16px.
23. **A track that skips a stop passes with no mark** (no dot, no gap, no change of width). Only the tracks that stop get dots. [NYC08, LON]
24. **An interchange is a set of dots, one per track, always joined by a thin Ink connector.** The connector runs centre to centre through all of the station's dots, is about 0.14 lw thick (0.12–0.15 lw), and follows 0°, 45° or 90°. It is drawn even when the dots touch: at the standard 1.12 lw pitch it shows across the hairline gap between neighbouring dots. It sits above the tracks and under the dots, and it joins separate bundles when the dots cannot touch. When a theme is highlighted (rule 41) it greys with the station: grey when none of the station's tracks are highlighted, Ink otherwise. The key's Interchange symbol shows the same connector. [owner decision; replaces "no connector needed when the dots touch"; NYC08, NYC72]
25. **The dots of an interchange do not have to sit on one straight line.** Each dot stays centred on its own track, wherever that track is. The tracks of an interchange may be on different horizontals, verticals or diagonals, and may approach from different directions. The connector bends to follow them, along 0°, 45° or 90°, with rounded corners. It can be straight, L-shaped or U-shaped, and it never crosses a track it does not serve. Dots that touch stay touching. For example, B and D stack vertically with the 4 offset to the side, and the 4 and 5 are joined by a U-shaped connector under the 2. [NYC full map]
26. **A terminal ends square, with no marker.** A branch or track stops about 0.3–1 lw past its last dot, with no ring, bar, arrow or ID disc. The dot at the last stop already shows the track's number. Terminal applies per branch: one branch of a track can end while another runs on. If a terminal is also an interchange, it also follows rules 24 and 25. [owner decision; replaces the NYC ID disc]
27. **Ongoing work runs off the map in its direction of travel, dashed past its last stop; no TODAY label, no end mark.** This applies per branch. A track or branch for work that is still continuing does not end in a terminal (rule 26). It is solid to just past its last stop (about 0.6 lw), then carries straight on in the direction it was travelling, dashed (same colour and width; about 1 lw dash, 0.5 lw gap, butt caps, starting with a gap), and leaves the edge of the map canvas, with no end disc, no stop mark at the edge and no TODAY label. The last stop on the branch (for example Aspada or Bad Idea Factory) is an ordinary station or interchange. In the vertical layout the run leaves in the rotated direction (north becomes west). The key's "Ongoing" symbol shows a short solid track and dot, then dashes cut at the swatch edge. [owner decision; replaces "runs to the edge that is today"]
28. **Space stops evenly within a straight run.** Do not space by true time. Typical gap about 12 lw, minimum about 8 lw. Within one run, gaps vary by 25% or less. Dense areas may take about 20 lw to leave room for labels. [LON] **Owner decision:** only order matters, not timing, so every station gets the same slot in career order.

### Labels

29. **Labels are horizontal and sit on the same side along a straight run.** They switch side only at a bend or to avoid a collision. A label never crosses a track, a dot or another label. [LON, NYC08]
30. **A label starts about 0.5–1 lw past the outer edge of the bundle.** It goes on the side away from the nearest parallel line. Long names stack on two or three lines, flush toward the line. [NYC08, LON]
31. **Weight labels by role.** Interchange and terminal labels are bold and dark. Plain stations are regular weight and a lighter grey. [NYC08, NYC72]

### Legend

The London map has a "Key to lines" and a "Key to symbols" outside the map frame. These rules come from them.

32. **Include a key to lines.** One entry per line: a short horizontal swatch drawn at the map's line width, in the line's colour, with the line's name beside it. Keep the entry order the same every time. [LON]
33. **List the tracks under their line in the key.** Each track is listed once, with its number (rule 22) and name (for example "5 Finding stories"). Branches are not listed separately. London does not do this, so it is an addition of ours. [new]
34. **Include a key to symbols.** Show every kind of stop exactly as it is drawn on the map, with a text label each: station, terminal, interchange, and the linked interchange if one is used. The symbols in the key are the same size as on the map. [LON]
35. **Draw part-time work as a solid track.** Part-time work is drawn as a solid track in the line colour, identical to full-time tracks: same width, same pitch (rules 10 and 11), same bundle rules. The map does not mark part-time, and the key has no part-time symbol. The station card says "part-time" for part-time stations. [owner decision; replaces hatching]
36. **Lay out the key as a left-aligned column.** Swatches or symbols sit in one column, and names sit at one fixed offset beside them. Group related entries under a short heading, and separate groups with a hairline rule. Each track appears once, as its number and name. The key uses the same typeface as the map labels and sits outside the map frame. [LON]

### Themes and concurrent work

37. **Concurrent roles are branches.** A theme is one track. When two roles of the same theme overlap in time, the track splits (rule 5) at the latest stop before the parallel work starts, and each concurrent role gets its own branch. A branch never serves two stations at the same time. Where full-time roles do not overlap, one branch passes through them in order. Part-time gigs never chain: each part-time station gets its own branch per theme, which ends there (a terminal), unless the gig is ongoing (rule 27), in which case the branch runs off the edge. Branch assignment is by time, earliest first, and is recorded in `data/transit-map-data.json` (one entry per branch under `tracks`). [new, owner decision]
38. **No letters.** A track's dots show its theme number only, on every branch (rule 22). There are no per-branch letters such as 5a or 5b, on the map or in the key. [new, owner decision; replaces numbered-plus-letter IDs]

### Label content

39. **A station label is the station name only.** No subtitle, role, or years under or beside the name. The map shows no years or time axis at all: only the order of stations matters. Years appear only in the station card. Rules 29–31 still set placement and weight. [new, owner decision]

### Screen sizes

40. **The map is responsive and works well on every screen size**, from phone to wide desktop. On narrow screens the map is redrawn in a vertical layout (time runs top to bottom), not shrunk or panned. All other rules still apply to the vertical layout. A library such as d3.js may be used to lay out and draw both layouts. [new, owner decision]

### Interaction

41. **Hover highlights the whole track.** With a mouse, hovering a track or any of its branches highlights the whole track and all its branches (hovering any part of track 5 highlights all of track 5); moving the pointer off ends it. Mouse clicks never pin a highlight: a click on the map only selects a station, and a click on track away from a station does nothing. On touch, tapping a track toggles its theme on; tapping it again, or tapping anywhere else, clears it. Tapping a station dot still selects the station. While a track is highlighted, it, all its branches and their dots stay unchanged; every other track turns flat grey and every other dot turns grey with its ID still readable. An ongoing branch's dashed run (rule 27) highlights and greys with its track. Station labels where the theme stops stay Ink and bold; all other labels turn grey. In the key, the theme's row gets a Pink block with Ink text and other rows turn grey. Hovering a theme row in the key, or giving it keyboard focus, highlights the same way; leaving or blurring the row clears it. [new, owner decision]

## Open decisions

- The name and theme of each track within a line, and which stops each track serves.
- The screen width at which the map switches from the wide layout to the vertical one (rule 40).
- Same-line crossings (rule 4) were chosen over separate bands for lines whose split tracks all have ongoing branches (journalism 5, 6, 7). Check the result on the map before applying it to the code line.
