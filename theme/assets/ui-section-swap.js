/* Generated from packages/ui/js/section-swap.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <section-swap> — links inside a section re-render it in place (Section Rendering API,
 * ?section_id=) instead of loading a new page: the URL updates (history), back / forward re-render,
 * the section's top is brought back into view when it is above the screen. Responses are cached
 * per URL. Without JS (or on a failed request) the links are ordinary links.
 *
 * Markup contract:
 *   <section-swap data-section="<section id>"> … <a href="…" data-section-link> … </section-swap>
 * The element's children are replaced by those of the <section-swap> in the response. State:
 * [aria-busy] while loading.
 */
const cache = new Map();

class SectionSwap extends HTMLElement {
  #controller;

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    window.addEventListener('popstate', this.#onPopState);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.#onPopState);
  }

  #onClick = (event) => {
    const link = event.target.closest('a[data-section-link]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    this.#swap(link.pathname + link.search, true);
  };

  #onPopState = (event) => {
    if (event.state?.sectionSwap === this.dataset.section) this.#swap(location.pathname + location.search, false);
  };

  async #swap(url, push) {
    const sectionUrl = new URL(url, location.origin);
    sectionUrl.searchParams.set('section_id', this.dataset.section);
    const key = sectionUrl.toString();
    this.setAttribute('aria-busy', 'true');
    try {
      if (!cache.has(key)) {
        this.#controller?.abort();
        this.#controller = new AbortController();
        cache.set(
          key,
          fetch(key, { signal: this.#controller.signal }).then((response) => {
            if (!response.ok) throw new Error(response.statusText);
            return response.text();
          })
        );
      }
      const html = new DOMParser().parseFromString(await cache.get(key), 'text/html');
      const next = html.querySelector('section-swap');
      if (!next) throw new Error('No section-swap in the response');
      this.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)));
      if (push) {
        // The first entry gets the state too, so going back to it re-renders
        if (!history.state?.sectionSwap) history.replaceState({ sectionSwap: this.dataset.section }, '');
        history.pushState({ sectionSwap: this.dataset.section }, '', url);
        this.#reveal();
      }
    } catch (error) {
      cache.delete(key);
      if (error.name !== 'AbortError') window.location.href = url;
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  // The top of the section above the screen (a shorter list): bring it back under the header
  #reveal() {
    const headerBottom = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
    const top = this.getBoundingClientRect().top - headerBottom - 16;
    if (top >= 0) return;
    window.scrollBy({ top, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

if (!customElements.get('section-swap')) customElements.define('section-swap', SectionSwap);
