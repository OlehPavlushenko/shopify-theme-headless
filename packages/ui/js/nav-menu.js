/**
 * <nav-menu> — desktop navigation with <details> dropdowns and mega menus.
 *
 * Markup contract: <nav-menu> containing <details data-menu-item> elements, each with a <summary>.
 * Works without JS (click to toggle). With JS it adds:
 * - hover intent on mouse pointers (open after a short delay, close when the pointer leaves)
 * - only one dropdown open at a time
 * - close on outside click and on Escape (focus returns to the summary)
 */
const OPEN_DELAY = 90;
const CLOSE_DELAY = 180;

class NavMenu extends HTMLElement {
  #timers = new WeakMap();

  connectedCallback() {
    this.items = [...this.querySelectorAll('details[data-menu-item]')];
    for (const item of this.items) {
      item.addEventListener('toggle', () => item.open && this.#closeOthers(item));
      item.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && this.#schedule(item, true));
      item.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && this.#schedule(item, false));
    }
    document.addEventListener('click', this.#onDocumentClick);
    this.addEventListener('keydown', this.#onKeydown);
  }

  disconnectedCallback() {
    document.removeEventListener('click', this.#onDocumentClick);
  }

  #schedule(item, open) {
    clearTimeout(this.#timers.get(item));
    this.#timers.set(
      item,
      setTimeout(() => (item.open = open), open ? OPEN_DELAY : CLOSE_DELAY)
    );
  }

  #closeOthers(current) {
    for (const item of this.items) if (item !== current) item.open = false;
  }

  #onDocumentClick = (event) => {
    if (!this.contains(event.target)) this.#closeOthers(null);
  };

  #onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    const open = this.items.find((item) => item.open);
    if (!open) return;
    open.open = false;
    open.querySelector('summary')?.focus();
  };
}

if (!customElements.get('nav-menu')) customElements.define('nav-menu', NavMenu);
