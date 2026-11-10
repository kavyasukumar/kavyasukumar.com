# 001 — Draw the Career Evolution timeline rail in on scroll

- **Status**: DONE
- **Commit**: 5d6eb65
- **Severity**: LOW (additive delight, not a fix)
- **Category**: Missed opportunities (rare-frequency delight / explanation)
- **Estimated scope**: 2 files (`src/App.tsx`, `src/components/Reveal.tsx`), ~15 lines

## Problem

On the one-page site, the vertical timeline rail in the "Career Evolution" section is
fully drawn before the cards appear. The cards reveal one by one (`Reveal`), but the
line that connects them is simply there, so the section has no sense of "career runs
top to bottom." Frequency: seen once per visit (rare tier), so a longer beat is allowed.
Purpose: explanation (it shows the order of the steps).

```tsx
/* src/App.tsx:264-268 — current */
          <div className="relative">
            <div
              className="absolute left-4 md:left-8 top-0 h-full w-[2px] z-0"
              style={{ backgroundColor: isDark ? `rgba(${PAPER},0.3)` : `rgba(${FIELD},0.25)` }}
            ></div>
```

```css
/* src/App.tsx:194-197 — current reduced-motion block (inside the <style> template) */
        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .reveal, .enter, .hero-line > span, .animate-marquee, .clip, .clip *, .cta { animation: none !important; transition: none !important; opacity: 1; transform: none; }
        }
```

```tsx
/* src/components/Reveal.tsx:35-43 — current */
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
```

## Target

The rail grows from its top to full height, once, when the timeline scrolls into view.

- Property: `transform` only (`scaleY`). Never animate `height`.
- Curve: `var(--ease)` = `cubic-bezier(0.22, 1, 0.36, 1)` (the repo's existing strong ease-out token, defined at `src/App.tsx:101`). Do NOT add a new curve.
- Duration: `900ms` (explanatory/marketing motion; allowed to be longer than the 300ms UI budget).
- Origin: `top` (the line is drawn in reading order).
- Trigger: add class `in` to the **container** that wraps the rail, not to the rail itself.
  A `scaleY(0)` element has a zero-height box, so an IntersectionObserver on the rail
  itself may never fire. Observe the full-height container instead.
- Plays once. It is a CSS transition (not a keyframe), so it never restarts from zero.

```css
/* target — add next to the other motion rules, BEFORE the reduced-motion block */
        /* Timeline rail draws in */
        .rail { transform-origin: top; transform: scaleY(0); transition: transform 900ms var(--ease); }
        .rail-wrap.in .rail { transform: scaleY(1); }
```

```css
/* target — reduced-motion block: add `.rail` to the existing selector list */
          .reveal, .enter, .hero-line > span, .animate-marquee, .clip, .clip *, .cta, .rail { animation: none !important; transition: none !important; opacity: 1; transform: none; }
```

`transform: none` there means the rail is simply fully drawn, with no motion. This works
because the `.rail` base rule appears earlier in the stylesheet than the media block and
has the same specificity, so the media block wins.

```tsx
/* target — src/components/Reveal.tsx */
type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'span';
  bare?: boolean; // observe + add `in`, but skip the default fade/translate `.reveal` styles
};

export const Reveal = ({ children, delay = 0, className = '', as = 'div', bare = false }: RevealProps) => {
  /* ...unchanged hook... */
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref}
      className={bare ? className : `reveal ${className}`}
      style={{ ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};
```

```tsx
/* target — src/App.tsx (timeline wrapper and rail) */
          <Reveal bare className="rail-wrap relative">
            <div
              className="rail absolute left-4 md:left-8 top-0 h-full w-[2px] z-0"
              style={{ backgroundColor: isDark ? `rgba(${PAPER},0.3)` : `rgba(${FIELD},0.25)` }}
            ></div>

            {/* ...the existing `<div className="relative flex flex-col gap-10 md:gap-16">` cards block, unchanged... */}
          </Reveal>
```

(The closing tag changes from `</div>` to `</Reveal>`, matching the opening `<div className="relative">` at line 264.)

## Repo conventions to follow

- Easing token: `--ease` at `src/App.tsx:101` (inside the `<style>` template). Reuse it.
- One-shot "scroll into view" pattern: `src/components/Reveal.tsx` (IntersectionObserver that adds `in` once and disconnects). Reuse it, do not write a second observer.
- Motion rules live in the `<style>` template in `src/App.tsx` (see the `.reveal` rules around line 161).

## Steps

1. `src/components/Reveal.tsx`: add the optional `bare` prop (default `false`) to `RevealProps`, destructure it, and change `className` to `bare ? className : \`reveal ${className}\``. Do nothing else.
2. `src/App.tsx`, `<style>` template: add the two `.rail` rules from Target immediately after the `.reveal.in` rule (around line 163), so they come before the reduced-motion block.
3. `src/App.tsx`, reduced-motion block (around line 196): append `, .rail` to the selector list.
4. `src/App.tsx` (around line 264): replace the wrapper `<div className="relative">` with `<Reveal bare className="rail-wrap relative">` and its closing `</div>` (the one that closes that wrapper, after the cards block) with `</Reveal>`. Add the `rail` class to the rail div. Leave everything else in that block as is.

## Boundaries

- Do NOT touch the cards, icon nodes, or their `Reveal` wrappers (plan 002 handles the icons).
- Do NOT animate `height`, `top` or `background`; `transform` only.
- Do NOT add a new easing curve, a motion library, or a new dependency.
- Do NOT change colours or the theme code.
- If the code you find does not match the excerpts above (drift since commit `5d6eb65`), STOP and report instead of improvising.

## Verification

- **Mechanical**: `npx vite build` completes with no errors.
- **Feel check**: run `npx vite --port 5174`, open the page, scroll to "Career Evolution":
  - The line grows from its top downwards in about 0.9s, once, and does not replay on scrolling away and back.
  - The cards still fade/slide in as before; the line is allowed to run ahead of cards below the fold.
  - In DevTools, Animations panel, set playback to 10% and confirm the growth is smooth with no jump at the end.
  - Reload while the section is already in view (scroll position restored): the line still draws once, and is never left invisible.
  - On a 375px-wide viewport the line is still fully drawn by the time the last card is visible.
  - Rendering panel, emulate `prefers-reduced-motion: reduce`: the line is fully drawn immediately, with no movement.
  - Test in both light and dark themes (`prefers-color-scheme`) and with `?theme=roseGanache` and `?theme=aubice`: the line colour is unchanged.
- **Done when**: the above checks pass and `git diff --stat` shows only `src/App.tsx` and `src/components/Reveal.tsx`.
