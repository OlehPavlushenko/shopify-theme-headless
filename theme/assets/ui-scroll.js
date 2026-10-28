/* Generated from packages/ui/js/scroll.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Scrolling below the header — pure helpers shared by the modules that move the page (FAQ, article
 * contents, filters, section swaps, sliders).
 *
 *   headerOffset(extra = 16) → px to keep free at the top: the header's full height (a scroll-up
 *     header may slide back in while the page moves), plus extra
 *   reducedMotion() → true with prefers-reduced-motion: reduce (checked on every call: it can change)
 *   scrollBehavior() → 'smooth', or 'auto' with reduced motion
 *   scrollToElement(element, extra) → scrolls so the element's top sits below the header
 */
export function headerOffset(extra = 16) {
  return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0) + extra;
}

export const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const scrollBehavior = () => (reducedMotion() ? 'auto' : 'smooth');

export function scrollToElement(element, extra) {
  window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY - headerOffset(extra), behavior: scrollBehavior() });
}
