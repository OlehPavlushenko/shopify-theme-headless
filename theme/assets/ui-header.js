/* Generated from packages/ui/js/header.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <site-header> — header behavior, framework-agnostic.
 *
 * Attributes (set by the server-rendered markup):
 * - data-sticky="none|always|scroll-up"  scroll-up hides the header while scrolling down
 * - data-transparent                     header overlays the first section until the page scrolls
 * State attributes it sets:
 * - data-scrolled  page is scrolled past the top (transparent header turns solid)
 * - data-hidden    scroll-up mode, header slid out of view
 * It also keeps --header-height on <html> in sync, for overlays and sticky offsets.
 * Stickiness itself is CSS (position: sticky on the section wrapper, see header.css).
 */
class SiteHeader extends HTMLElement {
  #lastY = 0;
  #ticking = false;
  #resizeObserver;

  connectedCallback() {
    this.#resizeObserver = new ResizeObserver(() => this.#syncHeight());
    this.#resizeObserver.observe(this);
    this.#syncHeight();
    this.#lastY = window.scrollY;
    this.#update();
    window.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    window.removeEventListener('scroll', this.#onScroll);
  }

  #syncHeight() {
    const bottom = Math.round(this.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--header-height', `${bottom}px`);
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
      const menuOpen = this.querySelector('details[open]');
      const goingDown = y > this.#lastY;
      const pastHeader = y > this.offsetHeight * 2;
      this.toggleAttribute('data-hidden', goingDown && pastHeader && !menuOpen);
    }
    this.#lastY = y;
  }
}

if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
