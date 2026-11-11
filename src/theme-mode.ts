// Runtime light/dark mode shared by both pages. Same storage key, default and toggle
// behaviour everywhere: a stored choice wins, else the OS preference.
// The pre-paint boot script in vite.config.ts does the same as resolveTheme + applyTheme.
import { THEME_STORAGE_KEY, themeColor, themeVars, type ThemeMode } from './theme-vars';

export function readStoredTheme(): ThemeMode | null {
  try {
    const v = window.localStorage.getItem(THEME_STORAGE_KEY);
    return v === 'dark' || v === 'light' ? v : null;
  } catch {
    return null;
  }
}

export function resolveTheme(): ThemeMode {
  return readStoredTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function storeTheme(mode: ThemeMode): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    /* storage unavailable */
  }
}

/** Set the theme variables, data-theme and theme-color on <html>. */
export function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const vars = themeVars(mode);
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.style.backgroundColor = vars['--bg'];
  root.style.color = vars['--fg'];
  root.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor(mode));
}

/** Calls `cb` when another tab changes the stored theme, or the OS preference changes while none is stored. */
export function onExternalThemeChange(cb: (mode: ThemeMode) => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onMedia = (e: MediaQueryListEvent): void => {
    if (!readStoredTheme()) cb(e.matches ? 'dark' : 'light');
  };
  const onStorage = (e: StorageEvent): void => {
    if (e.key === null || e.key === THEME_STORAGE_KEY) cb(resolveTheme());
  };
  mq.addEventListener('change', onMedia);
  window.addEventListener('storage', onStorage);
  return () => {
    mq.removeEventListener('change', onMedia);
    window.removeEventListener('storage', onStorage);
  };
}
