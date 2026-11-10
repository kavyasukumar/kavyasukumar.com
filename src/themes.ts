// Colour theme: Pistachio (the only one kept). Dusty pink accent is Rose Ganache's.
// field: dark-theme background / light-theme text. paper: light-theme background / dark-theme text.
// fill: solid accent blocks (use `ink` text on it). lineLight / lineDark: thin accents (rules, rings, underlines).
// Avoid palettes that read as national flags (see DESIGN.md).
export type Theme = {
  name: string;
  field: string;
  paper: string;
  fill: string;
  lineLight: string;
  lineDark: string;
  ink: string;
  // Optional dark-theme overrides for hybrid themes (light uses field/paper/fill).
  darkField?: string;
  darkPaper?: string;
  darkFill?: string;
};

export const THEMES: Record<string, Theme> = {
  pistachio: {
    name: 'Pistachio',
    field: '#0B3D2E',
    paper: '#F4E9D5',
    fill: '#E39BAE',
    lineLight: '#E39BAE',
    lineDark: '#E39BAE',
    ink: '#0A0A0A',
    darkPaper: '#F0DFBC'
  }
};

export const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
};

export const getTheme = (key: string | null): Theme => THEMES[key || ''] || THEMES.pistachio;
