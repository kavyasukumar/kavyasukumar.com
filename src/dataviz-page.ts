// Dataviz page shell (not the map): shared styles and the light/dark theme.
// The page has no toggle; it follows the stored choice (set on the main page), else the OS
// preference, and live-follows other tabs. The pre-paint boot script (vite.config.ts) has
// already applied the theme by the time this runs.
import './shared.css';
import { applyTheme, onExternalThemeChange, resolveTheme } from './theme-mode';

applyTheme(resolveTheme());
onExternalThemeChange(applyTheme);
