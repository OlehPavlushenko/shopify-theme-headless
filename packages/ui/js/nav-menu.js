/**
 * <nav-menu> — desktop navigation, disclosure pattern.
 *
 * Markup contract: <nav-menu> with items [data-menu-item], each holding a link (the title, always
 * navigates), a toggle button (aria-expanded, aria-controls) and the panel it controls.
 * Behavior:
 * - mouse: hover opens the item's panel after a short delay, leaving closes it
 * - toggle click (keyboard, touch): opens / closes
 * - one panel open at a time; outside click, Esc (focus back to the toggle) and focus leaving
 *   the item close it
 * State: [data-open] on the item + aria-expanded on its toggle. CSS shows the panel from that.
 */
const OPEN_DELAY = 90;
const CLOSE_DELAY = 200;

class NavMenu extends HTMLElement {
  #abort;
  #timers = new Map();
  #items = [];

  connectedCallback() {
    this.#items = [...this.querySelectorAll('[data-menu-item]')];
    const { signal } = (this.#abort = new AbortController());
    for (const item of this.#items) {
      item.addEventListener('pointerenter', this.#onPointerEnter, { signal });
      item.addEventListener('pointerleave', this.#onPointerLeave, { signal });
      item.addEventListener('focusout', this.#onFocusOut, { signal });
    }
    this.addEventListener('click', this.#onToggleClick, { signal });
    this.addEventListener('keydown', this.#onKeydown, { signal });
    document.addEventListener('click', this.#onDocumentClick, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    for (const timer of this.#timers.values()) clearTimeout(timer);
    this.#timers.clear();
  }

  #onToggleClick = (event) => {
    const toggle = event.target.closest('[data-menu-item] [aria-controls]');
    const item = toggle?.closest('[data-menu-item]');
    if (item && toggle === item.querySelector('[aria-controls]')) this.#set(item, !item.hasAttribute('data-open'));
  };

  #onPointerEnter = (event) => {
    if (event.pointerType === 'mouse') this.#schedule(event.currentTarget, true);
  };

  #onPointerLeave = (event) => {
    if (event.pointerType === 'mouse') this.#schedule(event.currentTarget, false);
  };

  #onFocusOut = (event) => {
    const item = event.currentTarget;
    // Focus dropped to the page (no new target) while the pointer is still over the item: not leaving it
    if (!event.relatedTarget && item.matches(':hover')) return;
    if (!item.contains(event.relatedTarget)) this.#set(item, false);
  };

  #schedule(item, open) {
    clearTimeout(this.#timers.get(item));
    this.#timers.set(
      item,
      setTimeout(() => this.#set(item, open), open ? OPEN_DELAY : CLOSE_DELAY)
    );
  }

  #set(item, open) {
    clearTimeout(this.#timers.get(item));
    if (open) {
      for (const other of this.#items) if (other !== item) this.#set(other, false);
    }
    item.toggleAttribute('data-open', open);
    item.querySelector('[aria-controls]')?.setAttribute('aria-expanded', String(open));
  }

  #onDocumentClick = (event) => {
    if (this.contains(event.target)) return;
    for (const item of this.#items) this.#set(item, false);
  };

  #onKeydown = (event) => {
    if (event.key !== 'Escape') return;
    const open = this.#items.find((item) => item.hasAttribute('data-open'));
    if (!open) return;
    this.#set(open, false);
    open.querySelector('[aria-controls]')?.focus();
  };
}

if (!customElements.get('nav-menu')) customElements.define('nav-menu', NavMenu);
