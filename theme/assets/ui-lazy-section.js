/* Generated from packages/ui/js/lazy-section.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <lazy-section> — a part of a section that isn't in the page's HTML (hidden UI: product sliders in
 * the search panel, the mega menu, a popup) and is fetched the first time it is shown.
 *
 * Markup contract:
 *   <lazy-section data-url="/" data-section="<section id>" data-key="<key>" [data-prefetch="<selector>"]>
 *     …placeholder: e.g. the heading and a link that works without JS…
 *   </lazy-section>
 * The section rendered on its own (data-url + ?section_id=, the Section Rendering API; headless: any
 * route rendering the same markup) holds the full element as [data-lazy-key="<key>"]; it replaces
 * the placeholder. It loads when the placeholder gets a box on screen (its overlay opened, near the
 * viewport), or earlier when the pointer or focus reaches an element matching data-prefetch (the
 * button that opens it). Placeholders of one section share one request.
 */
import { fetchHTML, sectionUrl } from '@ui/fetch-html';

const cache = new Map();

class LazySection extends HTMLElement {
  #abort;
  #observer;
  #loading = false;

  connectedCallback() {
    this.#observer = new IntersectionObserver((entries) => entries.some((entry) => entry.isIntersecting) && this.#load(), {
      rootMargin: '200px',
    });
    this.#observer.observe(this);
    const { signal } = (this.#abort = new AbortController());
    if (this.dataset.prefetch) {
      document.addEventListener('pointerover', this.#onIntent, { signal, passive: true });
      document.addEventListener('focusin', this.#onIntent, { signal });
    }
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
  }

  #onIntent = (event) => {
    if (event.target instanceof Element && event.target.closest(this.dataset.prefetch)) this.#load();
  };

  async #load() {
    if (this.#loading) return;
    this.#loading = true;
    this.#abort?.abort();
    this.#observer?.disconnect();
    try {
      const html = await fetchHTML(sectionUrl(this.dataset.url || '/', this.dataset.section), { cache });
      const content = html.querySelector(`[data-lazy-key="${CSS.escape(this.dataset.key)}"]`);
      if (content && this.isConnected) this.replaceWith(document.importNode(content, true));
    } catch {
      // Keeps the placeholder (its link still works)
    }
  }
}

if (!customElements.get('lazy-section')) customElements.define('lazy-section', LazySection);
