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
 * fit() recomputes the span (call it when the grid's column count changes). Without JS the link
 * opens the next page.
 */
import { fetchHTML, sectionUrl } from '@ui/fetch-html';

class LoadMore extends HTMLElement {
  #abort;
  #observer;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('click', this.#onClick, { signal });
    // The observer's first call sets the span after layout (no measuring while the page renders)
    this.#observer = new ResizeObserver(() => this.fit());
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
  }

  get #grid() {
    return this.querySelector('[data-load-more-grid]');
  }

  // From the layout, not from CSS values (they differ between browsers): the column where the last
  // item ends tells how many are left in its row. Never more than the grid has — a wider span
  // would add an implicit column and push the page sideways.
  fit() {
    const grid = this.#grid;
    const cell = grid?.querySelector('[data-load-more-cell]');
    if (!cell) return;
    const style = getComputedStyle(grid);
    const columns = style.gridTemplateColumns.split(' ').filter(Boolean).length || 1;
    const last = cell.previousElementSibling;
    let left = columns;
    if (last) {
      const gap = parseFloat(style.columnGap) || 0;
      const box = grid.getBoundingClientRect();
      const track = (box.width - gap * (columns - 1)) / columns;
      const endColumn = Math.round((last.getBoundingClientRect().right - box.left + gap) / (track + gap));
      left = columns - Math.min(Math.max(endColumn, 1), columns) || columns;
    }
    cell.style.gridColumn = `span ${left}`;
  }

  #onClick = async (event) => {
    const link = event.target.closest('[data-load-more-link]');
    if (!link) return;
    event.preventDefault();
    if (link.hasAttribute('aria-busy')) return;
    link.setAttribute('aria-busy', 'true');
    try {
      const html = await fetchHTML(sectionUrl(link.href, this.dataset.section));
      const cell = this.querySelector('[data-load-more-cell]');
      const items = [...html.querySelectorAll('[data-load-more-grid] > [data-load-more-item]')].map((item) =>
        document.importNode(item, true)
      );
      cell.before(...items);
      const next = html.querySelector('[data-load-more-cell]');
      if (next) cell.replaceWith(document.importNode(next, true));
      else cell.remove();
      this.fit();
      items[0]?.querySelector('a')?.focus({ preventScroll: true });
    } catch {
      window.location.href = link.href;
    }
  };
}

if (!customElements.get('load-more')) customElements.define('load-more', LoadMore);
