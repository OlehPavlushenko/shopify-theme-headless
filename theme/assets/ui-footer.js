/* Generated from packages/ui/js/footer.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <site-footer> — footer columns as accordions on phones.
 *
 * Markup contract: <site-footer> … <details data-footer-column open> <summary>…</summary> … </details> …
 * From 750px every column is open (the summary is a plain heading there, see footer.css);
 * below that they start closed and open on tap. The server renders them open, so without JS
 * nothing is hidden.
 */
const wide = matchMedia('(min-width: 750px)');

class SiteFooter extends HTMLElement {
  connectedCallback() {
    this.columns = [...this.querySelectorAll('[data-footer-column]')];
    this.#sync();
    wide.addEventListener('change', this.#sync);
  }

  disconnectedCallback() {
    wide.removeEventListener('change', this.#sync);
  }

  #sync = () => {
    for (const column of this.columns) column.open = wide.matches;
  };
}

if (!customElements.get('site-footer')) customElements.define('site-footer', SiteFooter);

// [data-back-to-top] (href="#", works without JS): a smooth scroll to the top (instant with
// "reduce motion"), focus moves to the start of the page
document.addEventListener('click', (event) => {
  const link = event.target.closest('[data-back-to-top]');
  if (!link) return;
  event.preventDefault();
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  document.body.setAttribute('tabindex', '-1');
  document.body.focus({ preventScroll: true });
  document.body.addEventListener('blur', () => document.body.removeAttribute('tabindex'), { once: true });
});
