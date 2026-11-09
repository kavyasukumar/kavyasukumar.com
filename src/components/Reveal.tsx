import React, { useEffect, useRef } from 'react';

type RevealProps = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'span';
};

// Adds the `in` class once the element scrolls into view. Styles live in App.tsx (.reveal).
export const Reveal = ({ children, delay = 0, className = '', as = 'div' }: RevealProps) => {
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
  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ ['--d' as string]: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};
