# Transit map: lines and tracks

Inputs for the redraw in `transit-map-rules.md`. Vocabulary: line = colour/facet, track = one theme of a line (split into branches where its work runs in parallel), stop = station / terminal / interchange.

**All names are working names.** The owner is naming lines and tracks as they come to mind and expects to refine and rename them later.

Short names (column "Short name") are for the map labels and the key; the long names stay as descriptions. Space is tight on the map.

Status: lines confirmed. Code (4 tracks), journalism (3), product (3), investing (2) and leadership and outreach (2) have tracks (14 total). Dropped "code as a problem solver" (covered by the line plus other tracks). Station walk done for all 14 tracks. Ongoing (owner rule): a track runs on only if a current station (Bad Idea Factory or Aspada) serves it; every other track ends as a terminal at its last station. Ends: Diligence (LightRock India) and Teaching and evangelism (its last full-time stop is Hearken; owner removed it from Bad Idea Factory). Finding stories and Storytelling are back on Bad Idea Factory, so they are ongoing. Years: station years only, no per-track dates (owner decision); stations are placed in career order only; the map shows no years (rule 39). All station years filled. Next: redraw (rules in transit-map-rules.md).

## Lines (in order)

1. code — Forest #0B3D2E (owner pick, replaces Ink)
2. journalism — Pink #E39BAE (from the old map)
3. product — Mint #9AD9B0 (owner pick, replaces Gold)
4. investing — Ink #0A0A0A (owner pick, replaces Mint; not drawn yet)
5. leadership and outreach — Raspberry #B0466F (owner pick; a darker pink) (added during the station walk; working name)

Gold #F2C14E (product on the old map) is now unused. On the map the ribbon runs journalism, code, product, top to bottom; every track is identified by one capital letter in ribbon order (owner decision): journalism A B C, code D E F G, product H I J, then leadership K L and investing M N, which are not drawn yet (`letter` on each theme in the data).

Colours are also stored as `colour` on each line in `data/transit-map-data.json`. Raspberry is 4.4:1 on Cream but 2.3:1 on Forest, so the map keeps its Cream background in both themes.

## Code line

| ID | Track | Short name | Theme | Stops | Ongoing? |
|---|-------|------------|-------|-------|----------|
| D | for the love of code | Love of code | Coding out of love and curiosity for all things coding | TBD | yes |
| F | code as a tool for social justice | SJW coder | Civic tech and advocacy tools; code that exposes or fixes injustice | TBD | yes |
| E | Data science | Data science | Data science and the engineering of data and visualization: analysis, pipelines, charting code, interactive tooling. The storytelling side (charts as stories) lives in journalism / Storytelling | TBD | yes |
| G | opensource coding | Open source | Contributing to others' open source plus creating and releasing my own | TBD | yes |

## Journalism line

| ID | Track | Short name | Theme | Stops | Ongoing? |
|---|-------|------------|-------|-------|----------|
| A | Finding stories | Finding stories | Data-driven investigations plus reporting, writing and editing stories (merged from Investigations and Reporting) | TBD | no |
| B | Storytelling and presentation | Storytelling | Craft of the story plus how it reaches the audience, including data and visualization as storytelling | TBD | no |
| C | Editorial tooling | Tooling | Newsroom workflow tools plus story-finding and verification tools | TBD | yes |

## Leadership and outreach line

| ID | Track | Short name | Theme | Stops | Ongoing? |
|---|-------|------------|-------|-------|----------|
| K | Team leadership and management | Leadership | Leading newsrooms, product and tech teams, and boards | TBD | yes |
| L | Teaching and evangelism of tech in media | Evangelism | Teaching and evangelising tech in media | TBD | yes |

## Product line

| ID | Track | Short name | Theme | Stops | Ongoing? |
|---|-------|------------|-------|-------|----------|
| H | product management | Product mgmt | Product strategy plus day-to-day delivery | TBD | yes |
| I | Product economics | Economics | Understanding the business of products and the realities of funding | TBD | yes |
| J | Fundraising and investor relations | Fundraising | Investor relations and fundraising, seen from the product side (owner wore a product manager hat) | TBD | yes |

## Investing line

| ID | Track | Short name | Theme | Stops | Ongoing? |
|---|-------|------------|-------|-------|----------|
| M | Investment diligence | Diligence | Evaluating and diligencing investments, on the tech front | TBD | no |
| N | Portfolio advisory | Advisory | Advising and supporting portfolio companies on product and tech; helping hire tech leaders | TBD | yes |

## Stations and the tracks that serve them

Station list taken from the old map (17), with Win Gaming, MSN Games and Bing Video merged into one Microsoft station (15 now). Walked one at a time; a station served by 2+ tracks is an interchange candidate (rule 24), one track is a station, a track's last stop is a terminal.

| # | Station | When | Lines | Tracks |
|---|---------|------|-------|--------|
| 1 | NIT Trichy | undergrad, 2002-06 | code | for the love of code; opensource coding |
| 2 | Microsoft | Win Gaming 2006, MSN Games 2006-09, Bing Video 2009-12 | code | for the love of code |
| 3 | Medill | grad school, 2012-13 | journalism | Finding stories; Storytelling and presentation |
| 4 | Palm Beach Post | data & interactives, 2014-15 | code, journalism, leadership and outreach | Data science; Finding stories; Storytelling and presentation; Editorial tooling; Team leadership and management |
| 5 | OpenNews | at Vox Media, 2015-16 | code, journalism, leadership and outreach | for the love of code; code as a tool for social justice; Data science; opensource coding; Storytelling and presentation; Editorial tooling; Teaching and evangelism of tech in media |
| 6 | Vox Media | full-stack +, 2016-18 | code, journalism | for the love of code; code as a tool for social justice; Data science; opensource coding; Storytelling and presentation; Editorial tooling; Finding stories |
| 7 | Bad Idea Factory | since 2018 | code, journalism, product | for the love of code; code as a tool for social justice; Data science; opensource coding; Finding stories; Storytelling and presentation; Editorial tooling; product management |
| 8 | Hearken | full-stack to product, 2018-20 | code, journalism, product, leadership and outreach | for the love of code; code as a tool for social justice; Data science; opensource coding; Editorial tooling; product management; Product economics; Fundraising and investor relations; Team leadership and management; Teaching and evangelism of tech in media |
| 9 | Seattle Globalist | board, 2019 | product, leadership and outreach | Team leadership and management; Fundraising and investor relations; Teaching and evangelism of tech in media |
| 10 | All Things Small | consulting, 2019-20 | code, journalism, product, leadership and outreach | for the love of code; Data science; Editorial tooling; Storytelling and presentation; product management; Product economics; Team leadership and management |
| 11 | UW Lecturer | teaching, 2020 | code, journalism, leadership and outreach | code as a tool for social justice; Data science; opensource coding; Finding stories; Storytelling and presentation; Editorial tooling; Teaching and evangelism of tech in media |
| 12 | Washington Post | sr engineer, 2020-22 | code, journalism | for the love of code; code as a tool for social justice; Data science; opensource coding; Finding stories; Storytelling and presentation; Editorial tooling |
| 13 | LightRock India | principal & CTO, 2022-25 | code, product, investing, leadership and outreach | code as a tool for social justice; Data science; Investment diligence; Portfolio advisory; Fundraising and investor relations; Team leadership and management |
| 14 | Lighthouse Reports | data specialist, 2024-25 | code, journalism, leadership and outreach | for the love of code; code as a tool for social justice; Data science; opensource coding; Finding stories; Storytelling and presentation; Editorial tooling; Teaching and evangelism of tech in media |
| 15 | Aspada | CTO, 2025- | code, product, investing, leadership and outreach | for the love of code; Data science; product management; Product economics; Portfolio advisory; Fundraising and investor relations; Team leadership and management |

Part-time or side ventures (owner): Bad Idea Factory, Seattle Globalist, All Things Small, UW Lecturer, Lighthouse Reports. Their branches are drawn solid like full-time ones (rule 35); the station card says "part-time".

Branches: each theme above is one track, labelled by its letter only (rule 38). Where its work runs in parallel, the track splits just after the latest stop before the parallel work starts, and each concurrent role gets its own branch (rules 5, 37). Full-time roles share one branch where they don't overlap. Part-time gigs never chain (owner, rule 37): each part-time station gets its own branch per theme that ends there, so All Things Small, UW Lecturer, Seattle Globalist and Lighthouse Reports are terminals (single-stop J-curves, rule 20); only Bad Idea Factory's branches run on. 14 themes (tracks) have 47 branches, listed in `data/transit-map-data.json` under `tracks` (one entry per branch; `label` is the track letter).

## Interview notes

### Code / for the love of code

Theme: coding because the owner loves to code, out of love and curiosity for all things coding.

### Code / code as a tool for social justice

Theme: both (a) civic tech and advocacy tools, software for causes, nonprofits and public-interest work, and (b) code that exposes or fixes injustice, such as scrapers, data tools and analysis aimed at accountability.

### Code / Data science

Theme: data science and the engineering of data and visualization: analysis, pipelines, charting code and interactive tooling. Narrowed by the owner: dataviz as storytelling belongs to journalism / Storytelling, and only the data and engineering side stays in code. Renamed from "Data science" to "Data science" by the owner.

### Code / opensource coding

Theme: both (a) contributing to others' open source projects, meaning patches, issues and maintenance, and (b) creating and releasing the owner's own open source libraries and tools.

### Journalism / Finding stories

Theme: finding stories: data-driven investigations plus reporting, writing and editing stories. Merged by the owner from "investigative reporting" and "Reporting" (reporting is finding stories).

### Journalism / Storytelling and presentation

Theme: both (a) how stories are shaped and told, meaning narrative craft, editing, structure and voice, and (b) how stories are presented, meaning visual and interactive formats, design and delivery to readers.

### Leadership and outreach / Teaching and evangelism of tech in media

Theme: teaching and evangelising tech in media. Moved from journalism to leadership and outreach by the owner.

### Leadership / Team leadership and management

Theme: leading newsrooms, product and tech teams, and boards. Owner moved this to its own line (fifth colour needed, check DESIGN.md palette).

### Journalism / Editorial tooling (short name: Tooling)

Theme: both (a) tools for newsroom workflow, meaning CMS, publishing, collaboration and production tools for editors and reporters, and (b) tools for finding and verifying stories, meaning scrapers, monitors, search and fact-checking tools.

### Product / product management

Theme: both (a) product strategy and vision, meaning deciding what to build and why, positioning and direction, and (b) managing products day to day, meaning roadmaps, prioritising, shipping, and working with engineers and users.

### Product / Fundraising and investor relations

Theme: investor relations and fundraising, from the product side. Placed in product (not investing) because the owner was wearing a product manager hat. A track stays in one line; where both lines matter, use an interchange. Working name.

### Product / Product economics

Theme: understanding the business of products and the realities of funding. Working name chosen by the owner from options; rename later.

### Investing / Investment diligence

Theme: evaluating and diligencing investments, on the tech front (the owner's clarification: the tech side of investing). Working name chosen by the owner from options; rename later.

### Investing / Portfolio advisory

Theme: advising and supporting portfolio companies on product and tech, and helping hire tech leaders. Working name chosen by the owner from options; rename later.
