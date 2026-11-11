import { Reveal } from './Reveal';

type SectionTitleProps = { first: string; second: string };

// `first` renders solid on top, `second` renders outlined below it. Motion is reveal-only.
export const SectionTitle = ({ first, second }: SectionTitleProps) => (
  <h2 className="section-title font-display uppercase">
    <Reveal as="span" className="block title-solid" delay={0}>
      {first}
    </Reveal>
    <Reveal as="span" className="block title-outline outline-word" delay={140}>
      {second}
    </Reveal>
  </h2>
);
