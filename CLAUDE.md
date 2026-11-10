# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Global instructions

Read `~/.claude/CLAUDE.md` first, before this file. Its rules (communication style, git attribution, branch naming, memory, ADHD mode) apply in this repo. Where this file conflicts with it, this file wins for repo-specific matters.

## Commands

- `npm run dev` — Vite dev server (serves both pages: `/` and `/dataviz.html`)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the built `dist/`
- No test runner, linter or formatter is configured. `tsc` is not wired to a script; type-check with `npx tsc --noEmit` if needed.

Deploy: pushing to `main` triggers `.github/workflows/webpack.yml` (despite the name, it runs `npm run build` and publishes `dist/` to GitHub Pages).

## Architecture

Two-page static Vite site (multi-page build in `vite.config.ts`: `index.html` and `dataviz.html`).

**Main page** (`index.html` → `src/main.tsx` → `src/App.tsx`): one-page React 18 + TypeScript portfolio.

- All copy and structured content lives in `src/siteData.ts`; keep content out of `App.tsx`.
- `src/themes.ts` holds the single Pistachio colour theme. Colours reach CSS via variables set from it. Light/dark mode is persisted in `localStorage` key `theme`.
- Styling is build-time Tailwind 3 (`tailwind.config.js`, `postcss.config.js`) plus `src/index.css`. Tailwind `content` only scans `index.html` and `src/**/*.{ts,tsx}`, so Tailwind classes used in `dataviz.html` will not be generated.
- `src/components/` has small motion/layout helpers (`Reveal`, `MarqueeDivider`, `SectionTitle`).
- `vite.config.ts` splits `react`/`react-dom` and `@phosphor-icons/react` into vendor/icons chunks and strips `console`/`debugger` in builds.

**Dataviz page** (`dataviz.html`): standalone, **not React**. Inline `<style>`, inline `<script>`, and a hand-authored inline SVG career "transit map" (`#transit`). A second "braided" section (`#braided`) is kept in the file but `hidden`. `career-transit-map.svg` at the root is a standalone export of that map. Earlier history shows the SVG was produced by a Python generator that is not in the repo, so edit the HTML/SVG directly and re-export the standalone SVG by hand if it needs to stay in sync.

## Design docs (read before UI changes)

- `DESIGN.md` — source of truth for the visual system: Pistachio palette (Cream / Forest / Pink / Ink), Bricolage Grotesque display, Space Grotesk body, JetBrains Mono for labels, flat colour with hard offset shadows, no gradients. The solid-word-over-outlined-word headline pairing is a fixed element. Avoid palettes that read as national flags.
- `docs/transit-map-rules.md` — rule set for the transit map redesign (core rules 1–8 set by the owner; rules 9+ are proposals until approved; open decisions listed at the end). Follow it when redrawing the map and use its vocabulary (line, track, bundle, stop → station / terminal / interchange; sizes in "lw").
- `redesign.interview-notes.md` — interview answers behind the redesign.
- `plans/` — numbered animation plans with a status table in `plans/README.md`.

## Branches

`main` is the deploy branch. Current work is on `feature/transit-map-redesign` (branched from `feature/dataviz-transit-map`).
