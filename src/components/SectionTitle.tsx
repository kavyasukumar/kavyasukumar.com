import { Reveal } from './Reveal';

type SectionTitleProps = { outline: string; solid: string; isDark?: boolean };

// Solid word over outlined word. Kept as the signature pairing; motion is reveal-only.
// (Prop names are historical: `outline` renders solid, `solid` renders outlined.)
export const SectionTitle = ({ outline, solid }: SectionTitleProps) => (
  <h2 className="section-title font-display uppercase">
    <Reveal as="span" className="block title-solid" delay={0}>
      {outline}
    </Reveal>
    <Reveal as="span" className="block title-outline" delay={140}>
      {solid}
    </Reveal>
  </h2>
);
