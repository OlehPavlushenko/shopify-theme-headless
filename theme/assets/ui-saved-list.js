/* Generated from packages/ui/js/saved-list.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Saved product lists kept in the browser (localStorage, per device): "wishlist" and "compare".
 *
 * Markup contract:
 *   <saved-toggle data-list="wishlist" data-handle data-title data-image data-url>
 *     <button type="button" aria-pressed="false" aria-label="…">…</button>
 *   </saved-toggle>                       — adds / removes the product; aria-pressed shows the state
 *   [data-saved-count="wishlist"]         — gets the number of items; [data-empty] when there are none
 *   [data-saved-counter="wishlist" data-one data-other="%n products"] — the same as text
 * Events on document: `saved-list:change` ({ detail: { list, items } }) after every change, also for
 * changes made in other tabs; `saved-list:toggle` ({ detail: { list, item, added } }) after a toggle;
 * `saved-list:full` ({ detail: { list, max } }) when a list is at its limit.
 * Toasts (@ui/toast) on toggle for a list whose texts are on the page: [data-saved-toast="<list>"].
 * Limits: compare holds MAX.compare items (a new one is refused), the wishlist MAX.wishlist.
 * "recent" (recently viewed) is written by recordView(), newest first.
 * Items: { handle, title, image, url } — enough for a toast's thumbnail without a request.
 * Storage can be unavailable (private mode, blocked): lists then live for the page only.
 */
import { showToast } from '@ui/toast';

const MAX = { wishlist: 100, compare: 4, recent: 12 };
const memory = {};
const key = (list) => `saved-list:${list}`;

export function getItems(list) {
  try {
    const value = JSON.parse(localStorage.getItem(key(list)));
    return Array.isArray(value) ? value : [];
  } catch {
    return memory[list] ?? [];
  }
}

function save(list, items) {
  memory[list] = items;
  try {
    localStorage.setItem(key(list), JSON.stringify(items));
  } catch {
    // Storage blocked: the in-memory copy keeps working for this page
  }
  document.dispatchEvent(new CustomEvent('saved-list:change', { detail: { list, items } }));
}

export const has = (list, handle) => getItems(list).some((item) => item.handle === handle);

export function toggle(list, item) {
  const items = getItems(list);
  const toggled = (added) => document.dispatchEvent(new CustomEvent('saved-list:toggle', { detail: { list, item, added } }));
  if (items.some((saved) => saved.handle === item.handle)) {
    save(
      list,
      items.filter((saved) => saved.handle !== item.handle)
    );
    toggled(false);
    return false;
  }
  if (items.length >= (MAX[list] ?? Infinity)) {
    document.dispatchEvent(new CustomEvent('saved-list:full', { detail: { list, max: MAX[list] } }));
    return false;
  }
  save(list, [...items, item]);
  toggled(true);
  return true;
}

// Toasts for a list, when the page gives their texts:
// <template data-saved-toast="wishlist" data-added data-removed data-view data-undo data-href [data-full]>
// Added / removed (with View / Undo) when the template has data-added; "list is full" (data-full,
// %n = the limit) with a link to the list, so a refused add is never silent
document.addEventListener('saved-list:toggle', (event) => {
  const { list, item, added } = event.detail;
  const texts = document.querySelector(`[data-saved-toast="${list}"]`)?.dataset;
  if (!texts?.added) return;
  showToast({
    message: added ? texts.added : texts.removed,
    image: item.image,
    action: added ? { label: texts.view, href: texts.href } : { label: texts.undo, onClick: () => toggle(list, item) },
  });
});

document.addEventListener('saved-list:full', (event) => {
  const { list, max } = event.detail;
  const texts = document.querySelector(`[data-saved-toast="${list}"]`)?.dataset;
  if (!texts?.full) return;
  showToast({ message: texts.full.replace('%n', max), action: { label: texts.view, href: texts.href } });
});

// Recently viewed ("recent"): the product goes first, the list keeps the last MAX.recent
export function recordView(item) {
  save('recent', [item, ...getItems('recent').filter((saved) => saved.handle !== item.handle)].slice(0, MAX.recent));
}

export const remove = (list, handle) =>
  save(
    list,
    getItems(list).filter((item) => item.handle !== handle)
  );

class SavedToggle extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('button');
    this.button.addEventListener('click', (event) => {
      event.preventDefault();
      const { list, handle, title, image, url } = this.dataset;
      toggle(list, { handle, title, image, url });
    });
    this.#render();
    document.addEventListener('saved-list:change', this.#onChange);
  }

  disconnectedCallback() {
    document.removeEventListener('saved-list:change', this.#onChange);
  }

  #onChange = (event) => {
    if (event.detail.list === this.dataset.list) this.#render();
  };

  #render() {
    this.button.setAttribute('aria-pressed', String(has(this.dataset.list, this.dataset.handle)));
  }
}

if (!customElements.get('saved-toggle')) customElements.define('saved-toggle', SavedToggle);

function renderCounts() {
  document.querySelectorAll('[data-saved-count]').forEach((element) => {
    const count = getItems(element.dataset.savedCount).length;
    element.textContent = count;
    element.toggleAttribute('data-empty', count === 0);
  });
  // Text counters: [data-saved-counter="<list>" data-one="1 product" data-other="%n products"]
  document.querySelectorAll('[data-saved-counter]').forEach((element) => {
    const count = getItems(element.dataset.savedCounter).length;
    element.textContent = count === 1 ? element.dataset.one : element.dataset.other.replace('%n', count);
    element.toggleAttribute('data-empty', count === 0);
  });
}

document.addEventListener('saved-list:change', renderCounts);
renderCounts();

// Changes from other tabs
window.addEventListener('storage', (event) => {
  const list = event.key?.startsWith('saved-list:') && event.key.slice('saved-list:'.length);
  if (list) document.dispatchEvent(new CustomEvent('saved-list:change', { detail: { list, items: getItems(list) } }));
});
