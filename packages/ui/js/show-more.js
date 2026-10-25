/**
 * <show-more> — a list shown in steps on phones ("Show more" under a product grid).
 *
 * Markup contract:
 *   <show-more data-step="4">
 *     <ul> <li>…</li> … <li data-more>…</li> </ul>
 *     <button data-show-more>Show more</button>
 *   </show-more>
 * Items with [data-more] are hidden on phones by CSS (sections.css); on larger screens CSS shows
 * everything and hides the button. A click reveals the next data-step items and moves focus to the
 * first of them; the button goes away when nothing is left.
 */
class ShowMore extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector('[data-show-more]');
    this.button?.addEventListener('click', () => this.#more());
  }

  #more() {
    const step = Number(this.dataset.step) || 4;
    const next = [...this.querySelectorAll('[data-more]')].slice(0, step);
    for (const item of next) item.removeAttribute('data-more');
    next[0]?.querySelector('a')?.focus({ preventScroll: true });
    if (!this.querySelector('[data-more]')) this.button.hidden = true;
  }
}

if (!customElements.get('show-more')) customElements.define('show-more', ShowMore);
