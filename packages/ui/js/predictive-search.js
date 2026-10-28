/**
 * <predictive-search> — search-as-you-type.
 *
 * Markup contract:
 * - data-endpoint   URL returning HTML that contains [data-predictive-results]
 *                   (Shopify: routes.predictive_search_url; headless: any route rendering the same markup)
 * - data-params     extra query string appended to every request (section_id, resources[...])
 * - data-products-endpoint, data-products-params (optional): a second URL asked at the same time
 *                   (Shopify: the search page, so the products match it). Its [data-predictive-results]
 *                   is what shows; the first one's goes into its [data-predictive-aside] slot (and
 *                   is dropped if that request fails). Without it the first one alone shows.
 * - input[type=search][name=q], [data-results] container, optional [data-empty-state]
 *   shown while the query is empty (popular searches, featured products)
 * Debounced, cancels stale requests (AbortController), caches responses per query.
 * ArrowDown from the input moves focus into the results; outside a <dialog>, Esc empties them, and
 * so does a submit of the form (a list under a field). Focuses the input when the surrounding
 * <dialog> opens (dialog:open from @ui/dialog).
 */
const DEBOUNCE = 220;

class PredictiveSearch extends HTMLElement {
  #timer;
  #controller;
  #cache = new Map();

  connectedCallback() {
    this.input = this.querySelector('input[name="q"]');
    this.results = this.querySelector('[data-results]');
    this.emptyState = this.querySelector('[data-empty-state]');
    if (!this.input || !this.results) return;

    this.input.addEventListener('input', this.#onInput);
    this.input.addEventListener('keydown', this.#onKeydown);
    this.input.form?.addEventListener('submit', () => this.#render(''));
    this.closest('dialog')?.addEventListener('dialog:open', () => {
      this.input.focus();
      this.input.select();
    });
  }

  #onInput = () => {
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#search(this.input.value.trim()), DEBOUNCE);
  };

  #onKeydown = (event) => {
    if (event.key === 'Escape' && !this.closest('dialog')) this.#render('');
    if (event.key !== 'ArrowDown') return;
    const first = this.results.querySelector('a, button');
    if (first) {
      event.preventDefault();
      first.focus();
    }
  };

  async #search(query) {
    this.#controller?.abort();
    if (!query) {
      this.#render('');
      return;
    }
    if (this.#cache.has(query)) {
      this.#render(this.#cache.get(query));
      return;
    }

    const controller = (this.#controller = new AbortController());
    this.setAttribute('aria-busy', 'true');
    try {
      const { productsEndpoint, productsParams } = this.dataset;
      const [suggestions, products] = await Promise.all([
        this.#fetch(this.dataset.endpoint, this.dataset.params, query, controller.signal).catch((error) => {
          if (!productsEndpoint || error.name === 'AbortError') throw error;
          return null;
        }),
        productsEndpoint ? this.#fetch(productsEndpoint, productsParams, query, controller.signal) : null,
      ]);
      let html = suggestions?.innerHTML.trim() ?? '';
      if (products) {
        const slot = products.querySelector('[data-predictive-aside]');
        if (slot && suggestions) slot.replaceChildren(...suggestions.childNodes);
        html = products.innerHTML.trim();
      }
      this.#cache.set(query, html);
      if (this.input.value.trim() === query) this.#render(html);
    } catch (error) {
      if (error.name !== 'AbortError') console.error(error);
    } finally {
      if (this.#controller === controller) this.removeAttribute('aria-busy');
    }
  }

  // The [data-predictive-results] element of a URL's HTML
  async #fetch(endpoint, params, query, signal) {
    const url = new URL(endpoint, location.origin);
    url.search = params ?? '';
    url.searchParams.set('q', query);
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Predictive search failed: ${response.status}`);
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
    return doc.querySelector('[data-predictive-results]');
  }

  #render(html) {
    this.results.innerHTML = html;
    this.toggleAttribute('data-has-results', Boolean(html));
    if (this.emptyState) this.emptyState.hidden = Boolean(html);
  }
}

if (!customElements.get('predictive-search')) customElements.define('predictive-search', PredictiveSearch);
