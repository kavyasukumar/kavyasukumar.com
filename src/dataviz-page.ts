// Dataviz page shell (not the map): shared styles and the light/dark toggle.
// The pre-paint boot script (vite.config.ts) has already applied the theme by the time this runs.
import './shared.css';
import { applyTheme, onExternalThemeChange, resolveTheme, storeTheme } from './theme-mode';

let mode = resolveTheme();
applyTheme(mode);

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  mode = mode === 'dark' ? 'light' : 'dark';
  storeTheme(mode);
  applyTheme(mode);
});

onExternalThemeChange((next) => {
  mode = next;
  applyTheme(mode);
});
