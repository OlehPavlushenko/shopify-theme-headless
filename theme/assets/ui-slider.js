/* Generated from packages/ui/js/slider.js by scripts/sync-ui.mjs. Do not edit here. */
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
 * data-loop: the arrows and autoplay go round — past the last page back to the first and back.
 * [data-slider-dots] (optional, data-label="Slide %n"): one dot per item, the current one has
 * aria-current; a click scrolls to its item.
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
    this.dots = this.querySelector('[data-slider-dots]');
    if (!this.track) return;
    this.vertical = this.dataset.axis === 'y';

    this.prev?.addEventListener('click', () => this.#go(-1));
    this.next?.addEventListener('click', () => this.#go(1));
    this.track.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#resizeObserver = new ResizeObserver(() => this.#update());
    this.#resizeObserver.observe(this.track);
    this.#mutationObserver = new MutationObserver(() => this.#update());
    this.#mutationObserver.observe(this.track, { childList: true });
    this.#buildDots();
    this.#update();
    this.#startAutoplay();
  }

  #buildDots() {
    if (!this.dots) return;
    const label = this.dots.dataset.label || '%n';
    this.dots.replaceChildren(
      ...[...this.track.children].map((item, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider__dot';
        dot.setAttribute('aria-label', label.replace('%n', index + 1));
        dot.addEventListener('click', () => this.track.scrollTo({ left: item.offsetLeft - this.track.offsetLeft, behavior: 'smooth' }));
        return dot;
      })
    );
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
      const max = this.vertical ? this.track.scrollHeight - this.track.clientHeight : this.track.scrollWidth - this.track.clientWidth;
      const position = this.vertical ? this.track.scrollTop : this.track.scrollLeft;
      // At the end: back to the first page with data-loop, otherwise stop
      if (position < max - 1 || this.hasAttribute('data-loop')) this.#go(1);
    }, seconds * 1000);
  }

  disconnectedCallback() {
    clearInterval(this.#autoplay);
    this.#resizeObserver?.disconnect();
    this.#mutationObserver?.disconnect();
  }

  #go(direction) {
    const { track } = this;
    const axis = this.vertical ? 'top' : 'left';
    const page = this.vertical ? track.clientHeight : track.clientWidth;
    const max = this.vertical ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = this.vertical ? track.scrollTop : track.scrollLeft;
    if (this.hasAttribute('data-loop') && direction > 0 && position >= max - 1) {
      track.scrollTo({ [axis]: 0, behavior: 'smooth' });
    } else if (this.hasAttribute('data-loop') && direction < 0 && position <= 1) {
      track.scrollTo({ [axis]: max, behavior: 'smooth' });
    } else {
      track.scrollBy({ [axis]: direction * page, behavior: 'smooth' });
    }
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
    const loop = this.hasAttribute('data-loop');
    if (this.prev) this.prev.disabled = !loop && position <= 1;
    if (this.next) this.next.disabled = !loop && position >= max - 1;
    if (this.dots) {
      const offsets = [...track.children].map((item) => Math.abs(item.offsetLeft - track.offsetLeft - position));
      const current = offsets.indexOf(Math.min(...offsets));
      [...this.dots.children].forEach((dot, index) => dot.toggleAttribute('aria-current', index === current));
    }
  }
}

if (!customElements.get('ui-slider')) customElements.define('ui-slider', UiSlider);
