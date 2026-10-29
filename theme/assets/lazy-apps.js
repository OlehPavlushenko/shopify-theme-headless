/**
 * <lazy-apps> — app blocks rendered only when they come near the screen (sections/apps.liquid,
 * "Load when near the screen"). Until then the page doesn't load what the app loads for them —
 * a Judge.me review widget is about 50 scripts.
 *
 *   <lazy-apps> <template> …the app blocks… </template> </lazy-apps>
 * - 600px before it scrolls into view, the template's content is put in place.
 * - Judge.me's loader looks for its widgets once, on page load: the widgets put in later get their
 *   entry module here (jdgm.CDN_BASE_URL + data-entry-point), each once, and — as its loader does —
 *   the stylesheets its manifest lists for the entry (data-entry-key) and its imports: the layout one
 *   holds the widget's spacing tokens (--jm-space-*), without it the widget has no gaps.
 * - A link to an id inside it (the rating's "#judgeme_product_reviews") puts it in place first, then
 *   scrolls there; so does a page opened with that hash.
 */
const loaded = new Set();

// The stylesheets Judge.me's manifest lists for an entry and its imports, each linked once
async function judgeMeStyles(base, entryKey) {
  try {
    const manifest = await (await fetch(base + 'manifest.json')).json();
    const link = (key) => {
      const item = manifest[key];
      if (!item) return;
      for (const file of item.css ?? []) {
        const href = base + file;
        if (document.querySelector(`link[href="${href}"]`)) continue;
        document.head.append(Object.assign(document.createElement('link'), { rel: 'stylesheet', href }));
      }
      item.imports?.forEach(link);
    };
    link(entryKey);
  } catch {
    // The widget still works, without its spacing
  }
}

// Judge.me widgets added after its loader ran: load their entry modules and stylesheets
function startJudgeMe(root) {
  const base = window.jdgm?.CDN_BASE_URL;
  if (!base) return;
  for (const widget of root.querySelectorAll('.jdgm-widget[data-entry-point]')) {
    const src = base + widget.dataset.entryPoint;
    if (loaded.has(src)) continue;
    loaded.add(src);
    if (widget.dataset.entryKey) judgeMeStyles(base, widget.dataset.entryKey);
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    document.head.append(script);
  }
}

class LazyApps extends HTMLElement {
  #observer;
  #abort;
  #template;

  connectedCallback() {
    this.#template = this.querySelector('template');
    if (!this.#template) return;
    const { signal } = (this.#abort = new AbortController());
    document.addEventListener('click', this.#onClick, { signal });
    if (location.hash && this.#holds(location.hash.slice(1))) return this.#reveal(location.hash.slice(1));
    this.#observer = new IntersectionObserver(([entry]) => entry.isIntersecting && this.#reveal(), { rootMargin: '600px 0px' });
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
    this.#abort?.abort();
  }

  #holds(id) {
    return Boolean(id && this.#template?.content.getElementById(id));
  }

  #onClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    const id = link?.hash.slice(1);
    if (!this.#holds(id)) return;
    event.preventDefault();
    this.#reveal(id);
  };

  #reveal(scrollTo) {
    if (!this.#template) return;
    this.#observer?.disconnect();
    this.#abort?.abort();
    this.#template.replaceWith(this.#template.content);
    this.#template = null;
    startJudgeMe(this);
    if (scrollTo) document.getElementById(scrollTo)?.scrollIntoView({ block: 'start' });
  }
}

if (!customElements.get('lazy-apps')) customElements.define('lazy-apps', LazyApps);
