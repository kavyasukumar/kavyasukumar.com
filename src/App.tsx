import React, { useState, useEffect } from 'react';
import {
  ArrowUpRight,
  Zap,
  ExternalLink,
  Quote,
  Sun,
  Moon
} from 'lucide-react';

import SITE_DATA from './siteData';
import { SectionTitle } from './components/SectionTitle';
import { MarqueeDivider } from './components/MarqueeDivider';
import { Reveal } from './components/Reveal';
import { getTheme, hexToRgb } from './themes';

// Display font candidates. Preview with ?font=bricolage | dela | unbounded (default: bricolage).
// [family, first-line offset, second-line offset] offsets pull glyph edges onto the grid line (em).
// Fourth value is letter-spacing in em.
const DISPLAY_FONTS: Record<string, [string, number, number, number]> = {
  archivo: ["'Archivo Black', sans-serif", 0.065, 0.04, -0.04],
  bricolage: ["'Bricolage Grotesque', sans-serif", 0.05, 0.035, 0.01],
  dela: ["'Dela Gothic One', sans-serif", 0.04, 0.03, -0.02],
  unbounded: ["'Unbounded', sans-serif", 0.05, 0.04, -0.03]
};

export default function App() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = (): void => setIsDark(!isDark);

  const scrollTo = (id: string): void => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const fontKey = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('font') || 'bricolage'
    : 'bricolage';
  const [displayFamily, off1, off2, track] = DISPLAY_FONTS[fontKey] || DISPLAY_FONTS.bricolage;

  // Palette comes from themes.ts (?theme=watermelon|forest).
  const themeKey = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('theme') : null;
  const T = getTheme(themeKey);
  const FIELD = hexToRgb(T.field);
  // Dark theme may override field/paper/fill (hybrid themes); light theme always uses field/paper/fill.
  const darkBg = T.darkField || T.field;
  const darkText = T.darkPaper || T.paper;
  const PAPER = hexToRgb(darkText);
  const fillNow = isDark ? (T.darkFill || T.fill) : T.fill;
  const PAL = { field: T.field, paper: T.paper, ink: T.ink };
  const colors = {
    bg: isDark ? darkBg : PAL.paper,
    text: isDark ? darkText : PAL.field,
    accent: isDark ? T.lineDark : T.lineLight,
    border: isDark ? `rgba(${PAPER},0.25)` : `rgba(${FIELD},0.18)`
  };

  const rootVars = {
    backgroundColor: colors.bg,
    color: colors.text,
    '--fg': colors.text,
    '--bg': colors.bg,
    '--accent': colors.accent,
    '--fill': fillNow,
    '--hairline': colors.border,
    // Outline words stroke at 2x and paint the fill over the inner half (paint-order),
    // which hides overlapping contours in variable fonts.
    '--stroke': isDark ? '4px' : '3px',
    '--stroke-hover': '6px',
    '--track': `${track}em`,
    '--hard': isDark ? PAL.ink : PAL.field,
    '--o1': `${-off1}em`,
    '--o2': `${-off2}em`,
    '--font-display': displayFamily
  } as React.CSSProperties;

  return (
    <div
      className="min-h-screen font-body overflow-x-hidden transition-colors duration-500"
      style={rootVars}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Dela+Gothic+One&family=Unbounded:wght@900&family=Space+Grotesk:wght@300;400;500;700&family=JetBrains+Mono:wght@700&display=swap');

        :root {
          --font-body: 'Space Grotesk', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
          --ease: cubic-bezier(0.22, 1, 0.36, 1);
          --gutter: clamp(1.5rem, 4vw, 3rem);
          --section-y: clamp(4rem, 10vw, 8rem);
          --title-gap: clamp(2rem, 5vw, 5rem);
        }

        .font-display { font-family: var(--font-display); }
        .font-body { font-family: var(--font-body); }
        .font-mono { font-family: var(--font-mono); }

        html { scroll-behavior: smooth; font-size: 18px; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${colors.bg}; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? darkText : PAL.field}; }

        ::selection { background: var(--fill); color: #0a0a0a; }
        :focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

        /* One container, one grid edge, used by every section including nav and footer */
        .wrap { width: 100%; max-width: 1440px; margin-inline: auto; padding-inline: var(--gutter); }
        .section { padding-block: var(--section-y); }

        /* Giant type */
        .hero-name {
          font-size: clamp(3rem, 15vw, 13rem);
          line-height: 0.9;
          letter-spacing: var(--track);
        }
        .hero-line { display: block; overflow: hidden; padding-block: 0.04em; padding-right: 0.1em; }
        .hero-line > span { display: block; }
        .hero-line:nth-child(1) { margin-left: var(--o1); }
        .hero-line:nth-child(2) { margin-left: var(--o2); }
        .hero-line:nth-child(1) > span { color: var(--fg); }
        .hero-line:nth-child(2) > span {
          color: var(--bg);
          paint-order: stroke fill;
          -webkit-text-stroke: var(--stroke) var(--fg);
          transition: -webkit-text-stroke-width 0.3s var(--ease);
        }
        .hero-line:nth-child(2) > span:hover { -webkit-text-stroke: var(--stroke-hover) var(--fg); }

        .section-title { font-size: clamp(2.5rem, 12vw, 10rem); line-height: 0.9; letter-spacing: var(--track); margin-bottom: var(--title-gap); }
        .title-solid { color: var(--fg); margin-left: var(--o1); }
        .title-outline { color: var(--bg); paint-order: stroke fill; -webkit-text-stroke: var(--stroke) var(--fg); margin-left: var(--o2); }

        .theme-toggle { --knob: 24px; }
        @media (min-width: 640px) { .theme-toggle { --knob: 32px; } }

        .label { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; }

        /* Nav */
        .nav-link { font-family: var(--font-mono); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; min-height: 44px; display: inline-flex; align-items: center; background-image: linear-gradient(var(--accent), var(--accent)); background-repeat: no-repeat; background-position: 0 85%; background-size: 0 3px; transition: background-size .4s var(--ease); }
        .nav-link:hover { background-size: 100% 3px; }
        @media (max-width: 480px) { .nav-link { letter-spacing: 0.08em; } }

        /* CTA: hard offset shadow, tactile press */
        .cta { background: var(--fill); color: #0a0a0a; box-shadow: 6px 6px 0 var(--hard); transition: transform .25s var(--ease), box-shadow .25s var(--ease); }
        .cta:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0 var(--hard); }
        .cta:active { transform: translate(4px, 4px); box-shadow: 2px 2px 0 var(--hard); }

        /* Reveal on scroll */
        .reveal { opacity: 0; transform: translateY(36px); transition: opacity .8s var(--ease), transform .8s var(--ease); transition-delay: var(--d, 0ms); }
        .reveal.in { opacity: 1; transform: none; }

        /* Hero entrance */
        @keyframes rise { from { transform: translateY(105%); } to { transform: translateY(0); } }
        @keyframes fade-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
        .hero-line > span { animation: rise 1s var(--ease) both; }
        .hero-line:nth-child(1) > span { animation-delay: .1s; }
        .hero-line:nth-child(2) > span { animation-delay: .26s; }
        .enter { animation: fade-up .9s var(--ease) both; animation-delay: var(--d, 0ms); }

        /* Cards */
        .card { border: 2px solid var(--hairline); background: ${isDark ? `rgba(${PAPER},0.08)` : `rgba(${FIELD},0.04)`}; }
        .clip { display: flex; flex-direction: column; padding: 2rem; border: 2px solid var(--hairline); background: var(--bg); position: relative; transition: transform .35s var(--ease), box-shadow .35s var(--ease), border-color .2s; }
        .clip .badge { background: var(--fill); padding: .5rem; transition: transform .35s var(--ease); }
        .clip .ext { transition: transform .35s var(--ease); }
        .clip .tag { color: inherit; padding: .15rem .4rem; transition: background .25s, color .25s; }
        @media (hover: hover) {
          .clip:hover { transform: translate(-4px, -6px); box-shadow: 8px 10px 0 var(--accent); border-color: var(--accent); }
          .clip:hover .badge { transform: rotate(-12deg) scale(1.1); }
          .clip:hover .ext { transform: translate(3px, -3px) scale(1.2); }
          .clip:hover .tag { background: var(--fill); color: #0a0a0a; }
          .clip:hover .clip-title { color: ${isDark ? darkText : 'inherit'}; }
        }
        .clip:active { transform: translate(-2px, -3px); box-shadow: 5px 6px 0 var(--accent); border-color: var(--accent); }
        .clip-grid > .reveal:nth-child(4n+2) { --d: 80ms; }
        .clip-grid > .reveal:nth-child(4n+3) { --d: 160ms; }
        .clip-grid > .reveal:nth-child(4n+4) { --d: 240ms; }

        .social { transition: background .25s, color .25s, transform .3s var(--ease); min-height: 44px; }
        @media (hover: hover) { .social:hover { background: var(--fill); color: #0a0a0a !important; transform: translateY(-4px); } }

        @media (prefers-reduced-motion: reduce) {
          html { scroll-behavior: auto; }
          .reveal, .enter, .hero-line > span, .animate-marquee, .clip, .clip *, .cta { animation: none !important; transition: none !important; opacity: 1; transform: none; }
        }
      `}</style>

      {/* --- HERO --- */}
      <section className="min-h-[100dvh] flex flex-col">
        <div className="wrap">
          <nav className="flex items-center justify-end gap-4 sm:gap-8 pt-6 md:pt-10 enter" style={{ ['--d' as string]: '0ms' }}>
            {SITE_DATA.navigation.map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)} className="nav-link" style={{ color: colors.text }}>
                {item.name}
              </button>
            ))}
            <button
              onClick={toggleTheme}
              className="theme-toggle relative w-14 sm:w-16 h-8 rounded-full border-2 transition-all duration-300 flex items-center px-1 shrink-0"
              title="Toggle Theme"
              aria-label="Toggle theme"
              style={{ borderColor: colors.text, backgroundColor: isDark ? `rgba(${PAPER},0.1)` : 'transparent' }}
            >
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center transition-transform duration-300"
                style={{ backgroundColor: colors.text, color: colors.bg, transform: isDark ? 'translateX(var(--knob, 32px))' : 'translateX(0)' }}
              >
                {isDark ? <Sun size={12} /> : <Moon size={12} />}
              </div>
            </button>
          </nav>
        </div>

        <div className="wrap flex-1 flex flex-col justify-center" style={{ paddingBlock: 'clamp(2rem, 6vw, 4rem)' }}>
          <span className="label flex items-center gap-2 mb-6 enter opacity-90" style={{ ['--d' as string]: '50ms' }}>
            <Zap size={14} fill={colors.text} /> {SITE_DATA.profile.title}
          </span>

          <h1 className="hero-name font-display uppercase mb-10 md:mb-14" aria-label={SITE_DATA.profile.name}>
            <span className="hero-line"><span>{SITE_DATA.profile.firstName}</span></span>
            <span className="hero-line"><span>{SITE_DATA.profile.lastName}</span></span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
            <p
              className="enter lg:col-span-8 text-2xl md:text-4xl font-medium leading-[1.15] max-w-3xl border-l-[12px] pl-6 md:pl-10 py-2 tracking-tight"
              style={{ borderLeftColor: colors.accent, ['--d' as string]: '500ms' }}
            >
              {SITE_DATA.profile.tagline}
            </p>
            <div className="enter lg:col-span-4 lg:justify-self-end w-full sm:w-auto" style={{ ['--d' as string]: '650ms' }}>
              <button
                onClick={() => scrollTo('pivot')}
                className="cta flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto px-8 sm:px-10 py-5 font-black uppercase tracking-widest text-sm"
              >
                EXPLORE
                <ArrowUpRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <MarqueeDivider isDark={isDark} color={fillNow} text={`Current Role: ${SITE_DATA.currentPursuit.role} @ ${SITE_DATA.currentPursuit.company}`} />

      {/* --- CAREER EVOLUTION --- */}
      <section id="pivot" className="section relative overflow-hidden">
        <div className="wrap">
          <SectionTitle isDark={isDark} outline="CAREER" solid="EVOLUTION" />

          <div className="relative">
            <div
              className="absolute left-4 md:left-8 top-0 h-full w-[2px] z-0"
              style={{ backgroundColor: isDark ? `rgba(${PAPER},0.3)` : `rgba(${FIELD},0.25)` }}
            ></div>

            <div className="relative flex flex-col gap-10 md:gap-16">
              {SITE_DATA.pivot.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <Reveal key={idx} className="relative flex flex-col items-start justify-center">
                    <div className="w-full z-10 transition-transform duration-500 hover:-translate-y-2 pl-16 md:pl-24 py-4">
                      <div className="card p-6 md:p-8 relative overflow-hidden">
                        <span className="label block mb-2" style={{ color: colors.text }}>
                          {step.phase} // {step.subtitle}
                        </span>
                        <h3 className="text-2xl md:text-3xl tracking-tighter mb-4 font-display uppercase leading-none">
                          {step.title}
                        </h3>
                        <p
                          className="text-base font-normal leading-relaxed max-w-2xl"
                          style={{ color: isDark ? `rgba(${PAPER},0.9)` : `rgba(${FIELD},0.85)` }}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>

                    <div className="absolute left-4 md:left-8 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <div
                        className="w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: colors.bg, borderWidth: '4px', borderStyle: 'solid', borderColor: colors.accent }}
                      >
                        <Icon size={24} style={{ color: colors.text }} />
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* --- MEDIA CLIPS --- */}
      <section id="clips" className="section">
        <div className="wrap">
          <SectionTitle isDark={isDark} outline="MEDIA" solid="CLIPS" />
          <div className="clip-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SITE_DATA.clips.map((clip, idx) => (
              <Reveal key={idx} className="flex">
                <a href={clip.url} target="_blank" rel="noreferrer" className="clip group w-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="badge">
                      <Quote size={16} fill="#0a0a0a" stroke="#0a0a0a" />
                    </div>
                    <ExternalLink size={18} className="ext" style={{ color: colors.text }} />
                  </div>
                  <span className="label block mb-4" style={{ color: colors.text }}>{clip.source}</span>
                  <h3 className="clip-title text-xl font-display uppercase leading-tight mb-6 transition-colors">
                    {clip.title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed font-normal mb-8"
                    style={{ color: isDark ? `rgba(${PAPER},0.82)` : `rgba(${FIELD},0.78)` }}
                  >
                    {clip.snippet}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t" style={{ borderColor: colors.border }}>
                    {clip.tags?.map(tag => (
                      <span key={tag} className="tag font-mono text-xs uppercase tracking-widest font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- CONTACT --- */}
      <section id="contact" className="section relative overflow-hidden" style={{ paddingBlock: 'calc(var(--section-y) * 1.5)' }}>
        <div className="wrap">
          <h2 className="hero-name font-display uppercase mb-12" style={{ fontSize: 'clamp(2.5rem, 14vw, 12rem)' }}>
            <Reveal as="span" className="block title-solid">GET IN</Reveal>
            <Reveal as="span" className="block title-outline" delay={140}>TOUCH</Reveal>
          </h2>
          <Reveal delay={200}>
            <a
              href={`mailto:${SITE_DATA.profile.email}`}
              className="inline-block font-display underline underline-offset-[10px] md:underline-offset-[20px] decoration-4 transition-all break-all"
              style={{ fontSize: 'clamp(1rem, 5.4vw, 3.5rem)', letterSpacing: 'var(--track)', color: colors.text, textDecorationColor: colors.accent }}
            >
              {SITE_DATA.profile.email}
            </a>
          </Reveal>

          <Reveal delay={300} className="flex flex-wrap gap-x-2 gap-y-2 mt-16 -ml-6">
            {[
              { label: 'LinkedIn', url: SITE_DATA.profile.socials.linkedin },
              { label: 'GitHub', url: SITE_DATA.profile.socials.github },
              { label: 'Blue Sky', url: SITE_DATA.profile.socials.bluesky },
              { label: 'Instagram', url: SITE_DATA.profile.socials.instagram }
            ].map(link => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="social label flex items-center px-6 py-3"
                style={{ color: colors.text }}
              >
                {link.label}
              </a>
            ))}
          </Reveal>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t-2 py-12" style={{ borderColor: colors.border }}>
        <div className="wrap flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="label opacity-70">© 2026 {SITE_DATA.profile.name}</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="label hover:opacity-50 transition-opacity min-h-[44px]"
          >
            BACK TO TOP ↑
          </button>
        </div>
      </footer>
    </div>
  );
}
