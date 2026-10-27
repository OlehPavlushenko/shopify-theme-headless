/**
 * Scrolling below the header — pure helpers shared by the modules that move the page (FAQ, article
 * contents, filters, section swaps).
 *
 *   headerOffset(extra = 16) → px to keep free at the top: the header's full height (a scroll-up
 *     header may slide back in while the page moves), plus extra
 *   scrollBehavior() → 'smooth', or 'auto' with prefers-reduced-motion
 *   scrollToElement(element, extra) → scrolls so the element's top sits below the header
 */
export function headerOffset(extra = 16) {
  return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0) + extra;
}

export const scrollBehavior = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth');

export function scrollToElement(element, extra) {
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerOffset(extra), behavior: scrollBehavior() });
}
