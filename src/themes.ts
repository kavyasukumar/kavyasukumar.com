// Colour themes. Default: pistachio (chosen). Others via ?theme=roseGanache | aubice.
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
    paper: '#F3E2BE',
    fill: '#FF7AB8',
    lineLight: '#FF7AB8',
    lineDark: '#FF7AB8',
    ink: '#0A0A0A'
  },
  aubice: {
    name: 'Aubergine & Ice',
    field: '#3A1245',
    paper: '#F3EAF7',
    fill: '#6FE7F2',
    lineLight: '#3A1245',
    lineDark: '#6FE7F2',
    ink: '#0A0A0A'
  },
  roseGanache: {
    name: 'Rose Ganache',
    field: '#3B1F14',
    paper: '#F7E6D4',
    fill: '#E39BAE',
    lineLight: '#B5546D',
    lineDark: '#E39BAE',
    ink: '#0A0A0A',
    darkField: '#1F1A1B',
    darkPaper: '#F7E6D4',
    darkFill: '#E39BAE'
  }
};

export const hexToRgb = (hex: string): string => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
};

export const getTheme = (key: string | null): Theme => THEMES[key || ''] || THEMES.pistachio;
