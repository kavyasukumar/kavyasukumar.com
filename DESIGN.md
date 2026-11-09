# Design System: kavyasukumar.com

Source of truth for the one-page portfolio redesign (branch `feature/redesign`). Derived from `redesign.interview-notes.md` and a review of the running site at desktop (1440px) and mobile (375px).

## 1. Visual Theme & Atmosphere

Neo-brutalist, type-first, colour-maximal. Layout is minimal and rigid; colour is loud. Giant display type is the hero of every section. Two flat, saturated fields (Electric Ultramarine and White) with one acid-lime accent. Density 3 (airy, few elements), Variance 6 (left-anchored, asymmetric, strict grid), Motion 7 (fluid, deliberate, more than today).

Fixed design element, do not alter: the **solid block word over outlined word** headline pairing (`KAVYA` solid / `SUKUMAR` outlined; `CAREER` solid / `EVOLUTION` outlined). It stays across all section titles. Subtle motion is allowed on it; fill/swap effects are not.

## 2. Color Palette & Roles

Two themes, both flat. No gradients.

- **Electric Ultramarine** (#0000FF) — Light-theme text, outlines, solid headline fill; dark-theme background.
- **Paper White** (#FFFFFF) — Light-theme background; dark-theme text and outlines.
- **Acid Lime** (#DEFF00) — The single accent: CTA fill, tagline rule, hover shadows, focus rings, selection, timeline node rings.
- **Ink** (#0A0A0A) — Text on Acid Lime only (replaces pure black). Never used as a page text colour.
- **Hairline** (rgba(0,0,255,0.15) light / rgba(255,255,255,0.25) dark) — Card borders and dividers.

Dark theme (Ultramarine field) notes from review: white 1px outlines on blue nearly vanish at section-title scale, so dark-theme outline strokes are 2px minimum. Card tint (white at 8%) reads well; keep. Lime accents read strongly on blue and can carry hover colour changes.

Rules: Lime is never used as text on White (fails contrast). On Ultramarine, Lime text is allowed for large type and hover states only. Outline strokes must stay at least 1.5px on body-adjacent sizes and 2px at display sizes to survive anti-aliasing.

## 3. Typography Rules

- **Display:** Current Archivo Black is functional but generic. Replace with a font with more character (see proposals). Uppercase, tracking -0.04em, leading 0.8–0.9.
- **Body:** Space Grotesk (keep) 400/500, leading 1.5, max 60ch.
- **Mono:** JetBrains Mono 700 for eyebrows, phases, tags. Minimum 12px (current 9–10px is too small).
- **Scale:** Fluid via `clamp()`. Hero name `clamp(4.5rem, 15vw, 13rem)`. Section titles `clamp(3.5rem, 11vw, 10rem)`. Body min 1rem.
- **Banned:** Inter, serif faces, system font fallbacks for display.

## 4. Component Stylings

- **Primary CTA (EXPLORE):** Acid Lime fill, Ink text, square corners, hard 6px offset shadow in Ink or Ultramarine (no blur shadow). Active: translate(3px,3px) and shadow collapses. One CTA per view.
- **Nav links:** Mono, 12px, uppercase, 44px minimum tap height. Underline in Lime on hover.
- **Theme toggle:** Keep slide toggle; add visible focus ring in Lime.
- **Clip cards:** 2px Hairline border, square corners. Hover: translate(-4px,-4px) with hard Lime offset shadow and Lime border. On touch devices (no hover), cards show the hover state on `:active` only.
- **Timeline cards:** Same border treatment as clips. Node circles keep Lime ring.
- **Contact links:** Pill-less, mono uppercase, Lime background block on hover.

## 5. Layout Principles

- One page container: `max-width: 1440px; margin-inline: auto; padding-inline: clamp(1.5rem, 4vw, 3rem)`. **Every** element in every section, including the nav, hero eyebrow, headline, tagline, CTA and footer, aligns to this single left and right edge.
- Nav is part of the container (not `absolute` with its own `right-10`), so its right edge matches the content edge exactly.
- Display type optical alignment: apply a negative `margin-left` of roughly `-0.05em` on giant headlines so glyph edges, not side bearings, sit on the grid line.
- Hero: `min-h-[100dvh]` (never `h-screen`). Grid with 12 columns; headline spans all, tagline spans 8, CTA spans 4 and aligns to the tagline baseline.
- Vertical rhythm: one spacing scale (8px base): section padding `clamp(4rem, 10vw, 8rem)`, title-to-content `clamp(2rem, 5vw, 5rem)`.
- Below 768px: single column, CTA full width, nothing right-floating.

## 6. Motion & Interaction

- **Easing:** Spring-like `cubic-bezier(0.22, 1, 0.36, 1)`, 500–800ms. No linear.
- **Hero entrance:** Name lines slide up from a clipped mask (translateY 100% to 0), 120ms stagger; eyebrow, tagline, CTA fade/rise after.
- **Scroll reveals:** Section titles reveal line by line as they enter view (outline word follows solid word). Cards cascade with 80ms stagger. Trigger once.
- **Clip hover:** Lift with hard shadow, quote badge rotates, title turns Lime in dark theme. Keep under 300ms.
- **Marquee:** Keep; pause on hover.
- **Performance:** Animate `transform` and `opacity` only.
- **Accessibility:** All of the above is disabled or reduced to an instant state under `prefers-reduced-motion: reduce`.

## 7. Anti-Patterns (Banned)

- No gradients, glows, or blurred drop shadows (hard offset shadows only).
- No second accent colour. No purple.
- No pure black text.
- No Inter, no generic serifs.
- No overlapping text (the stacked headline lines must not touch: leading must clear descenders and outline strokes).
- No scroll arrows, bouncing chevrons, or "scroll to explore" text.
- No `h-screen`. No horizontal scroll at any width.
- No text under 12px.
- No emoji, no custom cursors.
- No AI copy clichés.
