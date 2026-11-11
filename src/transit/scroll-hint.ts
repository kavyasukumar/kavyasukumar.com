// Rule 40 (phone): a 12 px Cream fade pinned to the frame's visible right edge, shown only while
// the frame can scroll further right. The hint sits in a non-scrolling wrapper (see dataviz.html),
// so it never moves with the content and causes no layout shift.

const END_SLACK = 1; // px of rounding allowed at the scroll end

export function initScrollHint(frame: HTMLElement, hint: HTMLElement): () => void {
  const update = (): void => {
    const room = frame.scrollWidth - frame.clientWidth - frame.scrollLeft;
    hint.classList.toggle('is-on', frame.scrollWidth > frame.clientWidth + END_SLACK && room > END_SLACK);
  };
  frame.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();
  return update;
}
