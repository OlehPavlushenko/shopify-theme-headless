/**
 * The wishlist and compare pages (and "recently viewed"): the lists live in the browser
 * (@ui/saved-list); each product's markup is fetched as HTML:
 *
 *   <saved-products data-list="wishlist|compare" data-section="<what renders one product>" data-state="loading">
 *     [data-saved-products] — container; its [data-saved-item] children are the products
 *     [data-saved-empty]    — the empty state
 *     [data-saved-skeleton] — loading placeholders (first load only), one per saved product
 *   </saved-products>
 * Optional: data-exclude="<handle>" (left out), data-limit="<n>" (the first n).
 * data-state (loading → filled | empty) decides in CSS (saved.css) which of the two shows;
 * --saved-count holds the number of products shown (the compare table sizes itself by it).
 *
 * For each saved product it fetches the product's HTML and appends its [data-saved-item] in list
 * order (elements already in the container, e.g. the compare label column, stay first):
 * - Shopify: /products/<handle>?section_id=<data-section> (Section Rendering API)
 * - with data-endpoint (headless): <data-endpoint>/<handle>?section=<data-section>
 * A product that no longer exists (404, or no item) is dropped from the list.
 * [data-saved-remove="<handle>"] buttons inside remove a product. Re-renders on every list change.
 */
import { fetchHTML, sectionUrl } from '@ui/fetch-html';
import { getItems, remove } from '@ui/saved-list';

const cache = new Map();

// null: no product page (404: deleted, archived or unpublished) or the section rendered no item — the
// product no longer exists. Other failures reject (the product stays in the list; not cached).
async function fetchItem(handle, section, endpoint) {
  const url = endpoint
    ? `${endpoint}/${encodeURIComponent(handle)}?section=${encodeURIComponent(section)}`
    : sectionUrl(`${window.Shopify?.routes?.root ?? '/'}products/${encodeURIComponent(handle)}`, section);
  try {
    const html = await fetchHTML(url, { cache });
    return html.querySelector('[data-saved-item]');
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

class SavedProducts extends HTMLElement {
  #abort;
  #run = 0;
  #container;

  connectedCallback() {
    this.#container = this.querySelector('[data-saved-products]');
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('click', this.#onClick, { signal });
    document.addEventListener('saved-list:change', this.#onChange, { signal });
    this.#render();
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#run += 1; // a render in flight leaves the page alone
  }

  #onClick = (event) => {
    const button = event.target.closest('[data-saved-remove]');
    if (button) remove(this.dataset.list, button.dataset.savedRemove);
  };

  #onChange = (event) => {
    if (event.detail.list === this.dataset.list) this.#render();
  };

  // data-state: loading (nothing shown yet) → filled | empty; CSS shows the container or the empty state
  async #render() {
    const run = ++this.#run;
    // data-exclude: a handle left out (the current product); data-limit: the most shown
    const items = getItems(this.dataset.list)
      .filter((item) => item.handle !== this.dataset.exclude)
      .slice(0, Number(this.dataset.limit) || undefined);
    if (!items.length) {
      this.#container.querySelectorAll('[data-saved-item]').forEach((node) => node.remove());
      this.dataset.state = 'empty';
      return;
    }
    // First load: as many skeleton placeholders as there are saved products
    this.style.setProperty('--saved-count', items.length);
    this.querySelectorAll('[data-saved-skeleton] > *').forEach((item, i) => (item.hidden = i >= items.length));
    this.setAttribute('aria-busy', 'true');
    const nodes = await Promise.all(
      items.map((item) => fetchItem(item.handle, this.dataset.section, this.dataset.endpoint).catch(() => undefined))
    );
    if (run !== this.#run) return; // a newer change is rendering
    items.forEach((item, i) => nodes[i] === null && remove(this.dataset.list, item.handle));
    const found = nodes.filter(Boolean).map((node) => document.importNode(node, true));
    // Inside <show-more data-step>: products past the step wait behind "Show more" on phones;
    // as many as were already shown stay shown when the list changes
    const more = this.querySelector('show-more');
    if (more) {
      const step = Number(more.dataset.step) || 4;
      const shown = Math.max(step, this.#container.querySelectorAll('[data-saved-item]:not([data-more])').length);
      found.forEach((node, i) => node.toggleAttribute('data-more', i >= shown));
      more.querySelector('[data-show-more]').hidden = found.length <= shown;
    }
    this.#container.querySelectorAll('[data-saved-item]').forEach((node) => node.remove());
    this.#container.append(...found);
    this.style.setProperty('--saved-count', found.length);
    this.dataset.state = found.length ? 'filled' : 'empty';
    this.removeAttribute('aria-busy');
  }
}

if (!customElements.get('saved-products')) customElements.define('saved-products', SavedProducts);
