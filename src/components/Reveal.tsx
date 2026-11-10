import React, { useEffect, useRef } from 'react';

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'span';
  bare?: boolean; // observe and add `in`, but skip the default fade/translate `.reveal` styles
};

// Adds the `in` class once the element scrolls into view. Styles live in App.tsx (.reveal).
export const Reveal = ({ children, delay, className = '', as = 'div', bare = false }: RevealProps) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('in');
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('in');
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  // Only set --d when a delay is passed explicitly; otherwise let App.tsx stylesheet rules (e.g. clip-grid nth-child stagger) apply.
  const style =
    delay === undefined ? undefined : ({ ['--d' as string]: `${delay}ms` } as React.CSSProperties);
  return (
    <Tag
      ref={ref}
      className={bare ? className : `reveal ${className}`}
      style={style}
    >
      {children}
    </Tag>
  );
};
