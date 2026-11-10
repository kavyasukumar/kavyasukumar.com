import { Zap } from 'lucide-react';

type MarqueeProps = { text: string; color?: string; textColor?: string };

export const MarqueeDivider = ({ text, color = '#E8238C', textColor = '#0a0a0a' }: MarqueeProps) => (
  <div
    className="marquee py-5 border-y-4 -rotate-1 overflow-hidden whitespace-nowrap z-20 relative"
    style={{ backgroundColor: color, borderColor: textColor, marginBlock: 'clamp(3rem, 8vw, 6rem)' }}
    role="img"
    aria-label={text}
  >
    <div className="flex animate-marquee">
      {[...Array(6)].map((_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="font-display text-2xl md:text-4xl uppercase px-8 flex items-center gap-8 italic"
          style={{ color: textColor }}
        >
          {text} <Zap size={24} fill={textColor} stroke={textColor} />
        </span>
      ))}
    </div>
  </div>
);
