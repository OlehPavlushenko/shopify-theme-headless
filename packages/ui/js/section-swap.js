/**
 * <section-swap> — links inside a section re-render it in place (Section Rendering API,
 * ?section_id=) instead of loading a new page: the URL updates (history), back / forward re-render,
 * the section's top is brought back into view when it is above the screen, and focus moves to the
 * section (the clicked link is gone). Responses are cached per URL; only the latest click renders.
 * Without JS (or on a failed request) the links are ordinary links and the forms post as usual.
 *
 * Markup contract:
 *   <section-swap data-section="<section id>" [data-section-forms] [data-title="…"] tabindex="-1">
 *     … <a href="…" data-section-link> …
 *   </section-swap>
 *   <form action="…" data-section-form> (anywhere on the page, with data-section-forms)
 * A form's GET request renders here too (an empty field is stopped before: <form-validate>); the
 * forms' q fields follow the URL shown. A URL of another template (the search page vs the page this
 * was rendered on) is fetched as a whole page — its section has another id — and its <section-swap>
 * is used. The element's children are replaced by those of the <section-swap> in the response, and
 * the document title by its data-title (the tab follows the topic / search).
 * State: [aria-busy] while loading.
 */
import { headerOffset, scrollBehavior } from '@ui/scroll';

const cache = new Map();
const isSearch = (url) => new URL(url, location.origin).pathname.endsWith('/search');

class SectionSwap extends HTMLElement {
  #controller;
  #request = 0;

  // Whether this was rendered on the search page: the section id belongs to that template
  #onSearch = isSearch(location.href);

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    window.addEventListener('popstate', this.#onPopState);
    if (this.hasAttribute('data-section-forms')) document.addEventListener('submit', this.#onSubmit);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this.#onPopState);
    document.removeEventListener('submit', this.#onSubmit);
  }

  #onSubmit = (event) => {
    const form = event.target.closest('form[data-section-form]');
    if (!form || event.defaultPrevented || form.method.toLowerCase() !== 'get') return;
    event.preventDefault();
    const params = new URLSearchParams(new FormData(form));
    this.#swap(`${new URL(form.action).pathname}?${params}`, true);
  };

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
    // Another template: the whole page (this section's id is unknown there)
    if (isSearch(url) === this.#onSearch) sectionUrl.searchParams.set('section_id', this.dataset.section);
    const key = sectionUrl.toString();
    // A newer click wins: the one before is aborted, and an older answer is ignored
    const request = ++this.#request;
    this.#controller?.abort();
    this.setAttribute('aria-busy', 'true');
    try {
      if (!cache.has(key)) {
        this.#controller = new AbortController();
        cache.set(
          key,
          fetch(key, { signal: this.#controller.signal })
            .then((response) => {
              if (!response.ok) throw new Error(response.statusText);
              return response.text();
            })
            // An aborted or failed request leaves the cache, so the next click fetches again
            .catch((error) => {
              cache.delete(key);
              throw error;
            })
        );
      }
      const text = await cache.get(key);
      if (request !== this.#request) return;
      const next = new DOMParser().parseFromString(text, 'text/html').querySelector('section-swap');
      if (!next) throw new Error('No section-swap in the response');
      this.replaceChildren(...[...next.childNodes].map((node) => document.importNode(node, true)));
      if (next.dataset.title) document.title = next.dataset.title;
      if (push) {
        // The first entry gets the state too, so going back to it re-renders
        if (!history.state?.sectionSwap) history.replaceState({ sectionSwap: this.dataset.section }, '');
        history.pushState({ sectionSwap: this.dataset.section }, '', url);
        this.#reveal();
      }
      this.#syncForms(url);
      this.focus({ preventScroll: true });
    } catch (error) {
      cache.delete(key);
      if (error.name !== 'AbortError' && request === this.#request) window.location.href = url;
    } finally {
      if (request === this.#request) this.removeAttribute('aria-busy');
    }
  }

  // The forms' search fields show the terms of the URL shown (empty off the search page)
  #syncForms(url) {
    const terms = isSearch(url) ? (new URL(url, location.origin).searchParams.get('q') ?? '') : '';
    document.querySelectorAll('form[data-section-form] input[name="q"]').forEach((input) => (input.value = terms));
  }

  // The top of the section above the screen (a shorter list): bring it back under the header
  #reveal() {
    const top = this.getBoundingClientRect().top - headerOffset();
    if (top < 0) window.scrollBy({ top, behavior: scrollBehavior() });
  }
}

if (!customElements.get('section-swap')) customElements.define('section-swap', SectionSwap);
