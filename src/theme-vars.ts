// Light/dark CSS variables for both pages, derived from themes.ts (the one palette source).
// Used by App.tsx (React root), theme-mode.ts (runtime toggle) and the pre-paint boot
// script that vite.config.ts injects into index.html and dataviz.html.
import { getTheme, hexToRgb } from './themes';

export type ThemeMode = 'light' | 'dark';
export const THEME_STORAGE_KEY = 'theme';

// Text on accent fills: deeper than the field green for contrast (~8:1 on the pink).
export const ON_FILL = '#04231A';

export function themeVars(mode: ThemeMode): Record<string, string> {
  const T = getTheme();
  const isDark = mode === 'dark';
  const darkText = T.darkPaper || T.paper;
  const FIELD = hexToRgb(T.field);
  const PAPER = hexToRgb(darkText);
  return {
    '--bg': isDark ? T.field : T.paper,
    '--fg': isDark ? darkText : T.field,
    '--accent': isDark ? T.lineDark : T.lineLight,
    '--fill': T.fill,
    '--on-fill': ON_FILL,
    '--hairline': isDark ? `rgba(${PAPER},0.25)` : `rgba(${FIELD},0.18)`,
    // Outline words stroke at 2x and paint the fill over the inner half (paint-order),
    // which hides overlapping contours in variable fonts.
    '--stroke': isDark ? '4px' : '3px',
    '--stroke-hover': '6px',
    '--hard': isDark ? ON_FILL : T.field,
    '--toggle-bg': isDark ? `rgba(${PAPER},0.1)` : 'transparent'
  };
}

/** Browser UI colour (<meta name="theme-color">): the page background. */
export const themeColor = (mode: ThemeMode): string => themeVars(mode)['--bg'];
