// <cart-recommendations data-endpoint="/recommendations"> — related products for what is in the cart, next to
// the cart drawer: the theme's element (theme/assets/cart.js) on the Storefront API.
// - Loads only while the drawer is open: on open and after cart changes.
// - Seeds: the 3 newest products in the cart; each one's rows come from <endpoint>/<handle> and are cached
//   per product for the session.
// - Lists are mixed round-robin, without products that are in the cart or in the drawer's own
//   "You may also like"; 10 at most.
// - Slides in a moment after the drawer; the close button hides it until the cart's products change.
// - Only the latest refresh renders.
import { fetchHTML, latest } from '@ui/fetch-html';
import { getJSON, setJSON } from '@ui/storage';
import { onCart } from './cart-client.js';

const LIMIT = 10;
const DELAY = 700;

class CartRecommendations extends HTMLElement {
  #abort;
  #off;
  #cache = new Map();
  #key = '';
  #dismissed = false;
  #timer;
  #refreshes = latest();
  #cart = null;
  #list;
  #dialog;

  connectedCallback() {
    this.#list = this.querySelector('[data-recs-list]');
    this.#dialog = this.closest('dialog');
    if (!this.#list || !this.#dialog || !this.dataset.endpoint) return;
    const { signal } = (this.#abort = new AbortController());
    this.#dialog.addEventListener('dialog:open', () => this.#refresh(DELAY), { signal });
    this.#dialog.addEventListener('close', () => this.#toggle(false), { signal });
    this.querySelector('[data-recs-close]')?.addEventListener(
      'click',
      () => {
        this.#dismissed = true;
        this.#toggle(false);
      },
      { signal }
    );
    this.#off = onCart((cart) => {
      this.#cart = cart;
      if (this.#dialog.open) this.#refresh(0);
    });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#off?.();
    this.#refreshes.abort();
    clearTimeout(this.#timer);
  }

  async #refresh(delay) {
    const { isCurrent } = this.#refreshes.next();
    // Newest lines last in the Storefront cart: the 3 newest products
    const handles = [...new Set((this.#cart?.lines.nodes ?? []).map((line) => line.merchandise.product.handle))].reverse();
    const seeds = handles.slice(0, 3);
    const key = seeds.join(',');
    if (key !== this.#key) {
      this.#key = key;
      this.#dismissed = false;
    }
    if (!seeds.length || this.#dismissed) return this.#toggle(false);
    const lists = await Promise.all(seeds.map((handle) => this.#load(handle)));
    if (!isCurrent()) return;
    const skip = new Set([
      ...handles,
      ...[...this.#dialog.querySelectorAll('.cart-upsell [data-product-handle]')].map((el) => el.dataset.productHandle),
    ]);
    const picked = [];
    for (let i = 0; picked.length < LIMIT && lists.some((list) => i < list.length); i++) {
      for (const list of lists) {
        const row = list[i];
        if (!row || skip.has(row.handle) || picked.length >= LIMIT) continue;
        skip.add(row.handle);
        picked.push(row);
      }
    }
    if (!picked.length) return this.#toggle(false);
    this.#list.innerHTML = picked.map((row) => row.html).join('');
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#dialog.open && this.#toggle(true), delay);
  }

  #load(handle) {
    const storageKey = `cart-recs:headless:v1:${handle}`;
    if (!this.#cache.has(handle)) {
      const stored = getJSON(storageKey, null, { session: true });
      this.#cache.set(handle, stored ? Promise.resolve(stored) : this.#fetch(handle, storageKey));
    }
    return this.#cache.get(handle);
  }

  async #fetch(handle, storageKey) {
    try {
      const doc = await fetchHTML(`${this.dataset.endpoint}/${encodeURIComponent(handle)}`);
      const rows = [...doc.querySelectorAll('[data-product-handle]')].map((el) => ({
        handle: el.dataset.productHandle,
        html: el.outerHTML,
      }));
      setJSON(storageKey, rows, { session: true });
      return rows;
    } catch {
      return [];
    }
  }

  #toggle(open) {
    if (!open) clearTimeout(this.#timer);
    this.toggleAttribute('data-open', open);
    this.inert = !open;
  }
}

if (!customElements.get('cart-recommendations')) customElements.define('cart-recommendations', CartRecommendations);
