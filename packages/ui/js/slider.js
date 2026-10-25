/**
 * <ui-slider> — slider on native CSS scroll-snap (styles: slider.css). Horizontal by default;
 * data-axis="y" + class slider--vertical make it vertical (the track needs a bounded height).
 *
 * Markup contract:
 *   <ui-slider class="slider" style="--slider-columns: 4; --slider-columns-mobile: 2.2;">
 *     <div class="slider__head"> heading … <div class="slider__nav"> [data-slider-prev] [data-slider-next] </div></div>
 *     <ul class="slider__track" data-slider-track> <li>…</li> </ul>
 *   </ui-slider>
 * Scrolling and swiping work without JS. This only wires the arrows: they scroll by one page,
 * get disabled at the edges, and the nav is hidden ([data-overflow] absent) when nothing overflows.
 * Items added later (e.g. fetched) are picked up too.
 * data-autoplay="<seconds>": moves one page on its own (back to the start after the last one);
 * pauses while hovered or focused, off with "reduce motion".
 */
class UiSlider extends HTMLElement {
  #ticking = false;
  #resizeObserver;
  #mutationObserver;
  #autoplay;

  connectedCallback() {
    this.track = this.querySelector('[data-slider-track]');
    this.prev = this.querySelector('[data-slider-prev]');
    this.next = this.querySelector('[data-slider-next]');
    if (!this.track) return;
    this.vertical = this.dataset.axis === 'y';

    this.prev?.addEventListener('click', () => this.#go(-1));
    this.next?.addEventListener('click', () => this.#go(1));
    this.track.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#resizeObserver = new ResizeObserver(() => this.#update());
    this.#resizeObserver.observe(this.track);
    this.#mutationObserver = new MutationObserver(() => this.#update());
    this.#mutationObserver.observe(this.track, { childList: true });
    this.#update();
    this.#startAutoplay();
  }

  #startAutoplay() {
    const seconds = Number(this.dataset.autoplay);
    if (!seconds || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let paused = false;
    const pause = (value) => () => (paused = value);
    this.addEventListener('pointerenter', pause(true));
    this.addEventListener('pointerleave', pause(false));
    this.addEventListener('focusin', pause(true));
    this.addEventListener('focusout', pause(false));
    this.#autoplay = setInterval(() => {
      if (paused || document.hidden) return;
      if (this.next && !this.next.disabled) this.#go(1);
      else this.track.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }, seconds * 1000);
  }

  disconnectedCallback() {
    clearInterval(this.#autoplay);
    this.#resizeObserver?.disconnect();
    this.#mutationObserver?.disconnect();
  }

  #go(direction) {
    const page = this.vertical ? this.track.clientHeight : this.track.clientWidth;
    this.track.scrollBy({ [this.vertical ? 'top' : 'left']: direction * page, behavior: 'smooth' });
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
    const { track } = this;
    const max = this.vertical ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = this.vertical ? track.scrollTop : track.scrollLeft;
    this.toggleAttribute('data-overflow', max > 1);
    if (this.prev) this.prev.disabled = position <= 1;
    if (this.next) this.next.disabled = position >= max - 1;
  }
}

if (!customElements.get('ui-slider')) customElements.define('ui-slider', UiSlider);
