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
 * [data-slider-dots] (optional, data-label="Slide %n"): one dot per item (rebuilt when the items
 * change), the current one has aria-current; a click scrolls to its item.
 * Scrolling is instant with "reduce motion" (@ui/scroll).
 */
import { reducedMotion, scrollBehavior } from '@ui/scroll';

class UiSlider extends HTMLElement {
  #abort;
  #ticking = false;
  #resizeObserver;
  #mutationObserver;
  #autoplay;
  #paused = false;
  #track;
  #prev;
  #next;
  #dots;
  #vertical = false;

  connectedCallback() {
    this.#track = this.querySelector('[data-slider-track]');
    this.#prev = this.querySelector('[data-slider-prev]');
    this.#next = this.querySelector('[data-slider-next]');
    this.#dots = this.querySelector('[data-slider-dots]');
    if (!this.#track) return;
    this.#vertical = this.dataset.axis === 'y';

    const { signal } = (this.#abort = new AbortController());
    this.#prev?.addEventListener('click', this.#onPrev, { signal });
    this.#next?.addEventListener('click', this.#onNext, { signal });
    this.#dots?.addEventListener('click', this.#onDot, { signal });
    this.#track.addEventListener('scroll', this.#onScroll, { passive: true, signal });
    // The observer's first call (after layout, before paint) runs #update: measuring here would
    // force a layout while the page is still rendering
    this.#resizeObserver = new ResizeObserver(() => this.#update());
    this.#resizeObserver.observe(this.#track);
    // Items added or removed (e.g. fetched): new dots, then the state
    this.#mutationObserver = new MutationObserver(this.#onItemsChange);
    this.#mutationObserver.observe(this.#track, { childList: true });
    this.#buildDots();
    this.#startAutoplay(signal);
  }

  disconnectedCallback() {
    this.#abort?.abort();
    clearInterval(this.#autoplay);
    this.#resizeObserver?.disconnect();
    this.#mutationObserver?.disconnect();
  }

  #onPrev = () => this.#go(-1);

  #onNext = () => this.#go(1);

  #onItemsChange = () => {
    this.#buildDots();
    this.#update();
  };

  #buildDots() {
    if (!this.#dots) return;
    const label = this.#dots.dataset.label || '%n';
    this.#dots.replaceChildren(
      ...[...this.#track.children].map((item, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider__dot';
        dot.setAttribute('aria-label', label.replace('%n', index + 1));
        return dot;
      })
    );
  }

  #onDot = (event) => {
    const dot = event.target.closest('.slider__dot');
    const item = dot && this.#track.children[[...this.#dots.children].indexOf(dot)];
    if (item) this.#track.scrollTo({ left: item.offsetLeft - this.#track.offsetLeft, behavior: scrollBehavior() });
  };

  #startAutoplay(signal) {
    const seconds = Number(this.dataset.autoplay);
    if (!seconds || reducedMotion()) return;
    this.addEventListener('pointerenter', this.#onPause, { signal });
    this.addEventListener('pointerleave', this.#onResume, { signal });
    this.addEventListener('focusin', this.#onPause, { signal });
    this.addEventListener('focusout', this.#onResume, { signal });
    this.#autoplay = setInterval(() => {
      if (this.#paused || document.hidden) return;
      const max = this.#vertical ? this.#track.scrollHeight - this.#track.clientHeight : this.#track.scrollWidth - this.#track.clientWidth;
      const position = this.#vertical ? this.#track.scrollTop : this.#track.scrollLeft;
      // At the end: back to the first page with data-loop, otherwise stop
      if (position < max - 1 || this.hasAttribute('data-loop')) this.#go(1);
    }, seconds * 1000);
  }

  #onPause = () => (this.#paused = true);

  #onResume = () => (this.#paused = false);

  #go(direction) {
    const track = this.#track;
    const axis = this.#vertical ? 'top' : 'left';
    const page = this.#vertical ? track.clientHeight : track.clientWidth;
    const max = this.#vertical ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = this.#vertical ? track.scrollTop : track.scrollLeft;
    const behavior = scrollBehavior();
    if (this.hasAttribute('data-loop') && direction > 0 && position >= max - 1) {
      track.scrollTo({ [axis]: 0, behavior });
    } else if (this.hasAttribute('data-loop') && direction < 0 && position <= 1) {
      track.scrollTo({ [axis]: max, behavior });
    } else {
      track.scrollBy({ [axis]: direction * page, behavior });
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

  // Every layout read first, then the writes (no forced reflow in between)
  #update() {
    const track = this.#track;
    const max = this.#vertical ? track.scrollHeight - track.clientHeight : track.scrollWidth - track.clientWidth;
    const position = this.#vertical ? track.scrollTop : track.scrollLeft;
    let current = -1;
    if (this.#dots) {
      const offsets = [...track.children].map((item) => Math.abs(item.offsetLeft - track.offsetLeft - position));
      current = offsets.indexOf(Math.min(...offsets));
    }
    const loop = this.hasAttribute('data-loop');
    this.toggleAttribute('data-overflow', max > 1);
    if (this.#prev) this.#prev.disabled = !loop && position <= 1;
    if (this.#next) this.#next.disabled = !loop && position >= max - 1;
    if (this.#dots) [...this.#dots.children].forEach((dot, index) => dot.toggleAttribute('aria-current', index === current));
  }
}

if (!customElements.get('ui-slider')) customElements.define('ui-slider', UiSlider);
