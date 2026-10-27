/* Generated from packages/ui/js/load-more.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <load-more> — "Load more" for a paginated grid: the next page's items are fetched (Section
 * Rendering API, ?section_id=) and appended before the "Load more" cell, which is then replaced by
 * the next page's cell (or removed on the last page). The cell spans the columns left in the last
 * row (items spanning a whole row, e.g. a featured article, count as a full row).
 *
 * Markup contract (cell: snippets/load-more-cell):
 *   <load-more data-section="<section id>">
 *     <ul data-load-more-grid> <li data-load-more-item>… <li data-load-more-cell> <a data-load-more-link href="?page=2"> </ul>
 *   </load-more>
 * Without JS the link opens the next page.
 */
class LoadMore extends HTMLElement {
  #observer;

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    // The observer's first call sets the span after layout (no measuring while the page renders)
    this.#observer = new ResizeObserver(() => this.#fit());
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  get #grid() {
    return this.querySelector('[data-load-more-grid]');
  }

  #fit() {
    const grid = this.#grid;
    const cell = grid?.querySelector('[data-load-more-cell]');
    if (!cell) return;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
    let used = 0;
    for (const child of grid.children) {
      if (child === cell) continue;
      const wide = getComputedStyle(child).gridColumnEnd === '-1';
      used = wide ? Math.ceil(used / columns) * columns + columns : used + 1;
    }
    cell.style.gridColumn = `span ${columns - (used % columns)}`;
  }

  #onClick = async (event) => {
    const link = event.target.closest('[data-load-more-link]');
    if (!link) return;
    event.preventDefault();
    link.setAttribute('aria-busy', 'true');
    try {
      const url = new URL(link.href, location.origin);
      url.searchParams.set('section_id', this.dataset.section);
      const response = await fetch(url);
      if (!response.ok) throw new Error(response.statusText);
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const cell = this.querySelector('[data-load-more-cell]');
      const items = [...html.querySelectorAll('[data-load-more-grid] > [data-load-more-item]')].map((item) =>
        document.importNode(item, true)
      );
      cell.before(...items);
      const next = html.querySelector('[data-load-more-cell]');
      if (next) cell.replaceWith(document.importNode(next, true));
      else cell.remove();
      this.#fit();
      items[0]?.querySelector('a')?.focus({ preventScroll: true });
    } catch {
      window.location.href = link.href;
    }
  };
}

if (!customElements.get('load-more')) customElements.define('load-more', LoadMore);
