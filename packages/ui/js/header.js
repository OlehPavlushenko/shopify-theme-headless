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
  #sliding = false;
  #slideTimer;
  #height = 0;
  #section;

  connectedCallback() {
    // The observer's first call (after layout, before paint) sets the height; measuring here would
    // force a layout while the page is still rendering
    this.#resizeObserver = new ResizeObserver(() => this.#syncHeight());
    this.#resizeObserver.observe(this);
    // No layout reads here — not even scrollY, which lays the page out while it is still
    // rendering: the observer's first call reads it (#syncHeight)
    // Scroll-up mode slides the header with a transition: --header-bottom is measured again once
    // the slide ends (or after a moment, if no transitionend comes)
    this.#section = this.closest('.site-header-section');
    this.#section?.addEventListener('transitionend', this.#onTransitionEnd);
    window.addEventListener('scroll', this.#onScroll, { passive: true });
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#section?.removeEventListener('transitionend', this.#onTransitionEnd);
    clearTimeout(this.#slideTimer);
    window.removeEventListener('scroll', this.#onScroll);
  }

  #onTransitionEnd = (event) => {
    if (event.target === this.#section && event.propertyName === 'translate') this.#endSlide();
  };

  #syncHeight() {
    const rect = this.getBoundingClientRect();
    if (!this.#height) {
      // First call, after layout: the scroll position the page opened at
      this.#lastY = window.scrollY;
      this.toggleAttribute('data-scrolled', this.#lastY > 4);
    }
    this.#height = Math.round(rect.height);
    document.documentElement.style.setProperty('--header-height', `${this.#height}px`);
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

  // A scroll frame reads first (the header's position; its height from the last #syncHeight),
  // then writes — no layout read in between
  #update() {
    const y = Math.max(window.scrollY, 0);
    const rect = this.#sliding ? null : this.getBoundingClientRect();
    this.toggleAttribute('data-scrolled', y > 4);

    if (this.dataset.sticky === 'scroll-up') {
      const menuOpen = this.querySelector('[data-menu-item][data-open], [popover]:popover-open');
      const goingDown = y > this.#lastY;
      const pastHeader = y > this.#height * 2;
      const wasHidden = this.hasAttribute('data-hidden');
      const hidden = goingDown && pastHeader && !menuOpen;
      this.toggleAttribute('data-hidden', hidden);
      // The slide starts: --header-bottom gets where the header ends up right away, so sticky things
      // under it (CSS-transitioned like the header) move with it; no measuring until it stops
      if (hidden !== wasHidden) {
        this.#sliding = true;
        clearTimeout(this.#slideTimer);
        this.#slideTimer = setTimeout(this.#endSlide, 800);
        document.documentElement.style.setProperty('--header-bottom', hidden ? '0px' : `${this.#height}px`);
      }
    }
    this.#lastY = y;
    if (rect && !this.#sliding) this.#syncBottom(rect);
  }

  #endSlide = () => {
    this.#sliding = false;
    this.#syncBottom();
  };
}

if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
