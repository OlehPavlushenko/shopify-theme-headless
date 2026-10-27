/**
 * <site-header> — header behavior, framework-agnostic.
 *
 * Attributes (set by the server-rendered markup):
 * - data-sticky="none|always|scroll-up"  scroll-up hides the header while scrolling down
 * - data-transparent                     header overlays the first section until the page scrolls
 * State attributes it sets:
 * - data-scrolled  page is scrolled past the top (transparent header turns solid)
 * - data-hidden    scroll-up mode, header slid out of view
 * It also keeps --header-height and --header-bottom (current bottom edge on screen) on <html> in sync,
 * for overlays, sticky offsets and panels that open under the header.
 * Stickiness itself is CSS (position: sticky on the section wrapper, see header.css).
 */
class SiteHeader extends HTMLElement {
  #lastY = 0;
  #ticking = false;
  #resizeObserver;

  connectedCallback() {
    // The observer's first call (after layout, before paint) sets the height; measuring here would
    // force a layout while the page is still rendering
    this.#resizeObserver = new ResizeObserver(() => this.#syncHeight());
    this.#resizeObserver.observe(this);
    requestAnimationFrame(() => {
      this.#lastY = window.scrollY;
      this.#update();
    });
    window.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    window.removeEventListener('scroll', this.#onScroll);
  }

  #syncHeight() {
    const rect = this.getBoundingClientRect();
    document.documentElement.style.setProperty('--header-height', `${Math.round(rect.height)}px`);
    this.#syncBottom(rect);
  }

  // Where the header ends on screen right now (panels that open under it, e.g. the mobile menu)
  #syncBottom(rect = this.getBoundingClientRect()) {
    document.documentElement.style.setProperty('--header-bottom', `${Math.max(0, Math.round(rect.bottom))}px`);
  }

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#update();
      this.#ticking = false;
    });
  };

  #update() {
    const y = Math.max(window.scrollY, 0);
    this.toggleAttribute('data-scrolled', y > 4);

    if (this.dataset.sticky === 'scroll-up') {
      const menuOpen = this.querySelector('[data-menu-item][data-open], [popover]:popover-open');
      const goingDown = y > this.#lastY;
      const pastHeader = y > this.offsetHeight * 2;
      this.toggleAttribute('data-hidden', goingDown && pastHeader && !menuOpen);
    }
    this.#lastY = y;
    this.#syncBottom();
  }
}

if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
