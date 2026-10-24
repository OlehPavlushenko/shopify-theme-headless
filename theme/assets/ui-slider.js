/* Generated from packages/ui/js/slider.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <ui-slider> — horizontal slider on native CSS scroll-snap (styles: slider.css).
 *
 * Markup contract:
 *   <ui-slider class="slider" style="--slider-columns: 4; --slider-columns-mobile: 2.2;">
 *     <div class="slider__head"> heading … <div class="slider__nav"> [data-slider-prev] [data-slider-next] </div></div>
 *     <ul class="slider__track" data-slider-track> <li>…</li> </ul>
 *   </ui-slider>
 * Scrolling and swiping work without JS. This only wires the arrows: they scroll by one page,
 * get disabled at the edges, and the nav is hidden ([data-overflow] absent) when nothing overflows.
 */
class UiSlider extends HTMLElement {
  #ticking = false;
  #resizeObserver;

  connectedCallback() {
    this.track = this.querySelector('[data-slider-track]');
    this.prev = this.querySelector('[data-slider-prev]');
    this.next = this.querySelector('[data-slider-next]');
    if (!this.track) return;

    this.prev?.addEventListener('click', () => this.#go(-1));
    this.next?.addEventListener('click', () => this.#go(1));
    this.track.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#resizeObserver = new ResizeObserver(() => this.#update());
    this.#resizeObserver.observe(this.track);
    this.#update();
  }

  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
  }

  #go(direction) {
    this.track.scrollBy({ left: direction * this.track.clientWidth, behavior: 'smooth' });
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
    const max = this.track.scrollWidth - this.track.clientWidth;
    const left = this.track.scrollLeft;
    this.toggleAttribute('data-overflow', max > 1);
    if (this.prev) this.prev.disabled = left <= 1;
    if (this.next) this.next.disabled = left >= max - 1;
  }
}

if (!customElements.get('ui-slider')) customElements.define('ui-slider', UiSlider);
