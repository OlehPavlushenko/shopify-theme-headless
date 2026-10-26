/**
 * Theme-only rendering of the wishlist and compare pages. The lists live in the browser
 * (@ui/saved-list); the markup comes from Liquid through the Section Rendering API:
 *
 *   <saved-products data-list="wishlist|compare" data-section="<section that renders one product>" data-state="loading">
 *     [data-saved-products] — container; its [data-saved-item] children are the products
 *     [data-saved-empty]    — the empty state
 *     [data-saved-skeleton] — loading placeholders (first load only), one per saved product
 *   </saved-products>
 * data-state (loading → filled | empty) decides in CSS (saved.css) which of the two shows;
 * --saved-count holds the number of products shown (the compare table sizes itself by it).
 *
 * For each saved product it fetches /products/<handle>?section_id=<data-section> and appends the
 * section's [data-saved-item] in list order (elements already in the container, e.g. the compare
 * label column, stay first). A product that no longer exists is dropped from the list.
 * [data-saved-remove="<handle>"] buttons inside remove a product. Re-renders on every list change.
 * Headless storefronts render the same items from Storefront API data.
 */
import { getItems, remove } from '@ui/saved-list';

const cache = new Map();

async function fetchItem(handle, section) {
  const key = `${handle}:${section}`;
  if (!cache.has(key)) {
    cache.set(
      key,
      fetch(`${window.Shopify?.routes?.root ?? '/'}products/${encodeURIComponent(handle)}?section_id=${section}`).then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.text();
      })
    );
  }
  // null: the section rendered no item — the product no longer exists
  const html = await cache.get(key);
  return new DOMParser().parseFromString(html, 'text/html').querySelector('[data-saved-item]');
}

class SavedProducts extends HTMLElement {
  connectedCallback() {
    this.container = this.querySelector('[data-saved-products]');
    this.empty = this.querySelector('[data-saved-empty]');
    this.addEventListener('click', (event) => {
      const button = event.target.closest('[data-saved-remove]');
      if (button) remove(this.dataset.list, button.dataset.savedRemove);
    });
    document.addEventListener('saved-list:change', this.#onChange);
    this.#render();
  }

  disconnectedCallback() {
    document.removeEventListener('saved-list:change', this.#onChange);
  }

  #onChange = (event) => {
    if (event.detail.list === this.dataset.list) this.#render();
  };

  // data-state: loading (nothing shown yet) → filled | empty; CSS shows the container or the empty state
  async #render() {
    const run = (this.run = (this.run ?? 0) + 1);
    const items = getItems(this.dataset.list);
    if (!items.length) {
      this.container.querySelectorAll('[data-saved-item]').forEach((node) => node.remove());
      this.dataset.state = 'empty';
      return;
    }
    // First load: as many skeleton placeholders as there are saved products
    this.style.setProperty('--saved-count', items.length);
    this.querySelectorAll('[data-saved-skeleton] > *').forEach((item, i) => (item.hidden = i >= items.length));
    this.setAttribute('aria-busy', 'true');
    const nodes = await Promise.all(items.map((item) => fetchItem(item.handle, this.dataset.section).catch(() => undefined)));
    if (run !== this.run) return; // a newer change is rendering
    items.forEach((item, i) => nodes[i] === null && remove(this.dataset.list, item.handle));
    const found = nodes.filter(Boolean).map((node) => document.importNode(node, true));
    // Inside <show-more data-step>: products past the step wait behind "Show more" on phones;
    // as many as were already shown stay shown when the list changes
    const more = this.querySelector('show-more');
    if (more) {
      const step = Number(more.dataset.step) || 4;
      const shown = Math.max(step, this.container.querySelectorAll('[data-saved-item]:not([data-more])').length);
      found.forEach((node, i) => node.toggleAttribute('data-more', i >= shown));
      more.querySelector('[data-show-more]').hidden = found.length <= shown;
    }
    this.container.querySelectorAll('[data-saved-item]').forEach((node) => node.remove());
    this.container.append(...found);
    this.style.setProperty('--saved-count', found.length);
    this.dataset.state = found.length ? 'filled' : 'empty';
    this.removeAttribute('aria-busy');
  }
}

if (!customElements.get('saved-products')) customElements.define('saved-products', SavedProducts);
