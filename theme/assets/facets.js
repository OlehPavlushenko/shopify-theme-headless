/**
 * Theme-only storefront filters for sections/main-collection (and the search page later).
 *
 *   <facet-filters data-section="<section id>">
 *     [data-facets-form] (snippets/facets) — the filter groups; the toolbar's sort select joins it
 *     [data-facets-body] [data-facets-clear] [data-facets-active] [data-facets-count] [data-facets-results]
 *     [data-facets-active-count] [data-facets-show] — parts replaced after every change
 *     [data-facets-link] — chip / "Clear all" links, fetched instead of followed
 *     <load-more> (@ui/load-more) around the grid — "Load more" appends the next page's products
 *     button[data-density] (the grid carries data-density too) — few (bigger cards: a column less, 1 on phones) / many (as set),
 *       remembered per browser
 *   </facet-filters>
 *
 * A change in the form (checkbox, sort, price after a pause) builds the URL from the form, fetches
 * it with ?section_id=<section>, replaces the parts above and pushes the URL to the history (back
 * and forward re-render). Open filter groups and the open drawer stay as they are. Responses are
 * cached per URL; only the latest change renders (an older request is aborted or ignored). Without
 * JS the form submits and every link is a real URL.
 * <price-range>: two number fields + a dual range slider kept in sync.
 */
import { headerOffset, scrollBehavior } from '@ui/scroll';

const cache = new Map();

// Selector of a form field, to find it again after the form is replaced
const inputSelector = (input) =>
  input.name ? `[name="${CSS.escape(input.name)}"]${input.type === 'checkbox' ? `[value="${CSS.escape(input.value)}"]` : ''}` : null;
const DENSITY_KEY = 'facets:density';

function readDensity() {
  try {
    return localStorage.getItem(DENSITY_KEY) || 'many';
  } catch {
    return 'many';
  }
}

function saveDensity(value) {
  try {
    localStorage.setItem(DENSITY_KEY, value);
  } catch {
    // Storage blocked: the choice lasts for this page
  }
}

class FacetFilters extends HTMLElement {
  #controller;
  #request = 0;
  #timer;
  #revealOnClose = false;
  #lastChanged = null;

  connectedCallback() {
    this.section = this.dataset.section;
    this.addEventListener('change', this.#onChange);
    this.addEventListener('input', this.#onInput);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('submit', (event) => {
      event.preventDefault();
      this.#apply(this.#formUrl());
    });
    this.addEventListener('toggle', this.#onToggle, true);
    document.addEventListener('click', this.#onOutsideClick);
    window.addEventListener('popstate', this.#onPopState);
    this.#applyDensity(readDensity());
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#onOutsideClick);
    window.removeEventListener('popstate', this.#onPopState);
  }

  get #form() {
    return this.querySelector('[data-facets-form]');
  }

  // URL of the current form state: empty fields are left out, so the URL stays short
  #formUrl() {
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(this.#form)) if (value !== '') params.append(key, value);
    const query = params.toString();
    return `${location.pathname}${query ? `?${query}` : ''}`;
  }

  #onChange = (event) => {
    if (event.target.closest('price-range')) return; // handled with a pause in #onInput
    if (event.target.matches('[data-facets-form] *, [data-facets-sort]')) {
      this.#lastChanged = inputSelector(event.target);
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.#apply(this.#formUrl()), 150);
    }
  };

  #onInput = (event) => {
    if (!event.target.closest('price-range')) return;
    clearTimeout(this.#timer);
    this.#timer = setTimeout(() => this.#apply(this.#formUrl()), 600);
  };

  #onClick = (event) => {
    const link = event.target.closest('a[data-facets-link]');
    if (link) {
      event.preventDefault();
      this.#apply(link.pathname + link.search);
      return;
    }
    const toggle = event.target.closest('[data-facet-more-toggle]');
    if (toggle) this.#toggleValues(toggle);
    const density = event.target.closest('button[data-density]');
    if (density) {
      saveDensity(density.dataset.density);
      this.#applyDensity(density.dataset.density);
    }
  };

  // Horizontal layout (desktop): the groups are dropdowns — one open at a time
  #onToggle = (event) => {
    if (event.target.matches?.('.facets__panel') && event.newState === 'closed') {
      if (this.#form) this.#form.style.minHeight = '';
      if (this.#revealOnClose) this.#revealResults();
      this.#revealOnClose = false;
      return;
    }
    const details = event.target;
    if (!details.matches?.('.facet') || !details.open || !this.#isDropdowns()) return;
    this.querySelectorAll('.facet[open]').forEach((other) => other !== details && (other.open = false));
  };

  #onOutsideClick = (event) => {
    if (!this.#isDropdowns() || event.target.closest('.facet')) return;
    this.querySelectorAll('.facet[open]').forEach((details) => (details.open = false));
  };

  #isDropdowns() {
    return this.classList.contains('facets--horizontal') && matchMedia('(min-width: 990px)').matches;
  }

  #onPopState = () => this.#apply(location.pathname + location.search, false);

  #toggleValues(button) {
    const group = button.closest('.facet__body');
    const items = group.querySelectorAll('[data-facet-more]');
    const expand = items[0]?.hidden;
    items.forEach((item) => (item.hidden = !expand));
    button.dataset.labelMore ??= button.textContent;
    button.textContent = expand ? button.dataset.labelLess : button.dataset.labelMore;
  }

  // The column count changes: the "Load more" cell takes the new room left in its row
  #applyDensity(value) {
    const grid = this.querySelector('[data-facets-grid]');
    if (grid) grid.dataset.density = value;
    this.querySelectorAll('button[data-density]').forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.density === value))
    );
    this.querySelector('load-more')?.fit?.();
  }

  async #fetch(url) {
    const sectionUrl = new URL(url, location.origin);
    sectionUrl.searchParams.set('section_id', this.section);
    const key = sectionUrl.toString();
    this.#controller?.abort();
    if (!cache.has(key)) {
      this.#controller = new AbortController();
      cache.set(
        key,
        fetch(key, { signal: this.#controller.signal })
          .then((response) => {
            if (!response.ok) throw new Error(response.statusText);
            return response.text();
          })
          // An aborted or failed request leaves the cache, so the next try fetches again
          .catch((error) => {
            cache.delete(key);
            throw error;
          })
      );
    }
    try {
      return new DOMParser().parseFromString(await cache.get(key), 'text/html');
    } catch (error) {
      cache.delete(key);
      throw error;
    }
  }

  async #apply(url, push = true) {
    // A newer change wins: an older answer arriving later is ignored
    const request = ++this.#request;
    this.setAttribute('aria-busy', 'true');
    try {
      const html = await this.#fetch(url);
      if (request !== this.#request) return;
      const next = html.querySelector('facet-filters');
      if (!next) throw new Error('No facets markup');
      this.#replace(next);
      if (push && url !== location.pathname + location.search) history.pushState({ facets: true }, '', url);
      if (push) this.#revealResults();
    } catch (error) {
      if (error.name === 'AbortError' || request !== this.#request) return;
      window.location.href = url;
    } finally {
      if (request === this.#request) this.removeAttribute('aria-busy');
    }
  }

  // Fewer results make the page shorter: when the top of the results is above the screen, bring it
  // back under the header (otherwise the shopper is left looking at the footer)
  #revealResults() {
    // Behind the open drawer the results aren't seen: the page scrolls once it closes, not now
    if (this.querySelector('.facets__panel:popover-open')) {
      this.#revealOnClose = true;
      return;
    }
    const anchor = this.querySelector('.facets__toolbar') || this;
    const top = anchor.getBoundingClientRect().top - headerOffset();
    if (top < 0) window.scrollBy({ top, behavior: scrollBehavior() });
  }

  // Swap the changing parts; keep which groups are open and where "Show more" was expanded
  #replace(next) {
    const active = document.activeElement;
    const focused = active?.closest('[data-facets-form]') ? inputSelector(active) : null;
    const open = new Set([...this.querySelectorAll('.facet[open]')].map((details) => details.dataset.facet));
    // The filters scroll inside the drawer's body (or the sticky sidebar) and are replaced: keep the
    // value just changed where it was on screen, or the list jumps
    const anchor = this.#lastChanged || focused;
    this.#lastChanged = null;
    // Where the value sits in the form (not on screen: independent of the scroll position)
    const anchorOffset = () => {
      const row = anchor && this.querySelector(`[data-facets-form] ${anchor}`)?.closest('.facet__value, .facet');
      return row ? row.getBoundingClientRect().top - this.#form.getBoundingClientRect().top : undefined;
    };
    const offsetBefore = anchorOffset();
    const scrollBefore = this.#scroller()?.scrollTop ?? 0;
    const drawerOpen = Boolean(this.querySelector('.facets__panel:popover-open'));
    const formHeight = this.#form?.offsetHeight ?? 0;
    const expanded = new Set(
      [...this.querySelectorAll('.facet')]
        .filter((details) => details.querySelector('[data-facet-more]:not([hidden])'))
        .map((details) => details.dataset.facet)
    );
    for (const selector of [
      '[data-facets-body]',
      '[data-facets-clear]',
      '[data-facets-active]',
      '[data-facets-count]',
      '[data-facets-results]',
      '[data-facets-show]',
    ]) {
      const current = this.querySelector(selector);
      const incoming = next.querySelector(selector);
      if (current && incoming) current.replaceWith(document.importNode(incoming, true));
    }
    const badge = this.querySelector('[data-facets-active-count]');
    const incomingBadge = next.querySelector('[data-facets-active-count]');
    if (badge && incomingBadge) {
      badge.textContent = incomingBadge.textContent;
      badge.hidden = incomingBadge.hidden;
    }
    const sort = this.querySelector('[data-facets-sort]');
    const incomingSort = next.querySelector('[data-facets-sort]');
    if (sort && incomingSort) sort.value = incomingSort.value;
    this.querySelectorAll('.facet').forEach((details) => {
      if (!this.#isDropdowns()) details.open = open.has(details.dataset.facet) || details.open;
      if (expanded.has(details.dataset.facet)) {
        const toggle = details.querySelector('[data-facet-more-toggle]');
        if (toggle) this.#toggleValues(toggle);
      }
    });
    this.#applyDensity(readDensity());
    const scroller = this.#scroller();
    if (scroller) {
      const offsetAfter = anchorOffset();
      const shift = offsetBefore !== undefined && offsetAfter !== undefined ? offsetAfter - offsetBefore : 0;
      // In the open drawer the list doesn't get shorter than it was plus the shift (groups left out
      // below would clamp the scroll and move everything); the min-height goes when it closes.
      // Set before the scroll position, in one assignment (Chrome clamps a second one to the old range)
      if (drawerOpen && this.#form) this.#form.style.minHeight = `${formHeight + Math.max(shift, 0)}px`;
      scroller.scrollTop = scrollBefore + shift;
    }
    if (focused) this.querySelector(`[data-facets-form] ${focused}`)?.focus({ preventScroll: true });
  }

  // What the filters scroll in: the open drawer's body, otherwise the panel (the sticky sidebar)
  #scroller() {
    return this.querySelector('.facets__panel:popover-open [data-facets-body]') || this.querySelector('.facets__panel');
  }
}

class PriceRange extends HTMLElement {
  connectedCallback() {
    this.min = this.querySelector('[data-price-min]');
    this.max = this.querySelector('[data-price-max]');
    this.rangeMin = this.querySelector('[data-range-min]');
    this.rangeMax = this.querySelector('[data-range-max]');
    this.addEventListener('input', this.#sync);
    this.#paint();
  }

  // The slider writes into the fields (and back); the thumbs never cross
  #sync = (event) => {
    const top = Number(this.dataset.max);
    if (event.target === this.rangeMin || event.target === this.rangeMax) {
      const low = Math.min(Number(this.rangeMin.value), Number(this.rangeMax.value));
      const high = Math.max(Number(this.rangeMin.value), Number(this.rangeMax.value));
      this.min.value = low > 0 ? low : '';
      this.max.value = high < top ? high : '';
    } else {
      this.rangeMin.value = this.min.value || 0;
      this.rangeMax.value = this.max.value || top;
    }
    this.#paint();
  };

  #paint() {
    const top = Number(this.dataset.max) || 1;
    this.style.setProperty('--range-from', `${(Number(this.rangeMin.value) / top) * 100}%`);
    this.style.setProperty('--range-to', `${(Number(this.rangeMax.value) / top) * 100}%`);
  }
}

if (!customElements.get('facet-filters')) customElements.define('facet-filters', FacetFilters);
if (!customElements.get('price-range')) customElements.define('price-range', PriceRange);
