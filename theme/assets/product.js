/**
 * Theme-only behavior of the product page (sections/main-product and its neighbours).
 *
 * <product-gallery data-layout="grid|thumbnails|stacked">
 *   [data-gallery-track] > [data-media-id] items; [data-gallery-current] counter (phones, thumbnails);
 *   [data-thumb="<i>"] thumbnails; [data-zoom="<i>"] opens the lightbox (#Lightbox-…) at that image.
 *   On a variant change (from <product-info>): the slider scrolls to the variant's image; the grid
 *   and the stacked layout move it to the top on wide screens.
 * <quantity-input>: − / + buttons around a number input.
 * <sticky-buy-bar hidden>: shown once the main add button has scrolled up out of view.
 * <delivery-estimate data-min data-max data-cutoff data-template data-template-today data-locale>:
 *   "Order within 3 h — delivered Thu 29 Oct – Mon 2 Nov" (business days, today's cut-off hour).
 * <stock-notify data-product hidden>: the back-in-stock form, shown for sold-out variants only; its
 *   [data-notify-variant] / [data-notify-product] fields follow the variant.
 * <pickup-availability data-root>: on a variant change, fetches the pickup info of that variant
 *   (/variants/<id>/?section_id=pickup-availability) into itself.
 * <share-button data-url data-title data-copied>: the system share sheet, else copies the link.
 * <product-recommendations data-url [data-replace]>: fetched once it nears the viewport; fills
 *   its [data-recommendations] (or, with data-replace, swaps itself for the response); hidden when
 *   empty.
 * Records the product in the recently viewed list (@ui/saved-list).
 */
import { deliveryDates, formatLeft } from '@ui/delivery';
import { openDialog } from '@ui/dialog';
import { recordView } from '@ui/saved-list';

const wide = matchMedia('(min-width: 990px)');

class ProductGallery extends HTMLElement {
  connectedCallback() {
    this.track = this.querySelector('[data-gallery-track]');
    this.counter = this.querySelector('[data-gallery-current]');
    this.track.addEventListener('scroll', this.#onScroll, { passive: true });
    this.addEventListener('click', this.#onClick);
    this.closest('product-info')?.addEventListener('variant:change', (event) => this.#show(event.detail.variant?.featured_media?.id));
  }

  get #items() {
    return [...this.track.children];
  }

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      const { scrollLeft, clientWidth } = this.track;
      const index = Math.round(scrollLeft / clientWidth);
      if (this.counter) this.counter.textContent = index + 1;
      this.querySelectorAll('[data-thumb]').forEach((thumb, i) => thumb.toggleAttribute('aria-current', i === index));
    });
  };

  #ticking = false;

  #onClick = (event) => {
    const thumb = event.target.closest('[data-thumb]');
    if (thumb) {
      const item = this.#items[Number(thumb.dataset.thumb)];
      this.track.scrollTo({ left: item.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
      this.querySelectorAll('[data-thumb]').forEach((other) => other.toggleAttribute('aria-current', other === thumb));
      return;
    }
    const zoom = event.target.closest('[data-zoom]');
    if (zoom) this.#zoom(zoom.closest('[data-media-id]'));
  };

  #show(mediaId) {
    const item = mediaId && this.track.querySelector(`[data-media-id="${mediaId}"]`);
    if (!item) return;
    const layout = this.dataset.layout;
    if (wide.matches && (layout === 'grid' || layout === 'stacked')) {
      this.track.prepend(item);
      return;
    }
    this.track.scrollTo({ left: item.offsetLeft - this.track.offsetLeft, behavior: 'smooth' });
  }

  #zoom(item) {
    const dialog = this.closest('product-info')?.querySelector('.product-lightbox');
    if (!dialog) return;
    openDialog(dialog);
    const target = dialog.querySelector(`[data-index="${item.dataset.index}"]`);
    const track = dialog.querySelector('[data-lightbox-track]');
    requestAnimationFrame(() => target && track.scrollTo({ top: 0, left: target.offsetLeft - track.offsetLeft, behavior: 'instant' }));
  }
}

class QuantityInput extends HTMLElement {
  connectedCallback() {
    this.input = this.querySelector('input');
    this.addEventListener('click', (event) => {
      const step = event.target.closest('[data-qty]');
      if (!step) return;
      const min = Number(this.input.min) || 1;
      this.input.value = Math.max(min, (Number(this.input.value) || min) + Number(step.dataset.qty));
      this.input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
}

class StockNotify extends HTMLElement {
  connectedCallback() {
    this.closest('product-info')?.addEventListener('variant:change', (event) => {
      const variant = event.detail.variant;
      this.hidden = !variant || variant.available;
      if (!variant) return;
      this.querySelector('[data-notify-variant]').value = variant.id;
      const title = variant.title === 'Default Title' ? '' : ` / ${variant.title}`;
      this.querySelector('[data-notify-product]').value = this.dataset.product + title;
    });
  }
}

class PickupAvailability extends HTMLElement {
  connectedCallback() {
    this.closest('product-info')?.addEventListener('variant:change', async (event) => {
      const id = event.detail.variant?.id;
      if (!id) return;
      try {
        const response = await fetch(`${this.dataset.root.replace(/\/$/, '')}/variants/${id}/?section_id=pickup-availability`);
        if (!response.ok) return;
        const html = new DOMParser().parseFromString(await response.text(), 'text/html');
        const content = html.querySelector('[data-pickup-content]');
        if (content) this.replaceChildren(...[...content.childNodes].map((node) => document.importNode(node, true)));
      } catch {
        // Keeps what it shows
      }
    });
  }
}

class StickyBuyBar extends HTMLElement {
  connectedCallback() {
    const button = this.closest('product-info')?.querySelector('[data-product-form] [data-add-button]');
    if (!button) return;
    this.observer = new IntersectionObserver(([entry]) => {
      // Visible once the main button is above the viewport (not while it is still below it)
      this.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
    });
    this.observer.observe(button);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }
}

class DeliveryEstimate extends HTMLElement {
  connectedCallback() {
    const { min, max, cutoff, template, templateToday, locale, timeLong, timeShort } = this.dataset;
    const { shipsToday, from, to, minutesLeft } = deliveryDates({ min, max, cutoff });
    const format = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const dates = `${format.format(from)} – ${format.format(to)}`;
    const text = shipsToday
      ? templateToday.replace('%time', formatLeft(minutesLeft, timeLong, timeShort)).replace('%dates', dates)
      : template.replace('%dates', dates);
    this.querySelector('[data-delivery-text]').textContent = text;
  }
}

class ShareButton extends HTMLElement {
  connectedCallback() {
    this.querySelector('button').addEventListener('click', async () => {
      const { url, title, copied } = this.dataset;
      if (navigator.share) {
        try {
          await navigator.share({ url, title });
        } catch {
          // Cancelled
        }
        return;
      }
      await navigator.clipboard?.writeText(url);
      const label = this.querySelector('[data-share-label]');
      const text = label.textContent;
      label.textContent = copied;
      setTimeout(() => (label.textContent = text), 2000);
    });
  }
}

class ProductRecommendations extends HTMLElement {
  connectedCallback() {
    if (this.hasAttribute('data-loaded')) return; // the fetched copy that replaced the shell
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.observer.disconnect();
        this.#load();
      },
      { rootMargin: '600px 0px' }
    );
    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  async #load() {
    try {
      const response = await fetch(this.dataset.url);
      if (!response.ok) throw new Error(response.statusText);
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      if (this.hasAttribute('data-replace')) {
        const next = html.querySelector('product-recommendations');
        if (next?.querySelector('[data-slider-track] > li')) {
          next.setAttribute('data-loaded', '');
          this.replaceWith(document.importNode(next, true));
        } else this.hidden = true;
        return;
      }
      const list = html.querySelector('[data-recommendations]');
      if (!list?.children.length) {
        this.hidden = true;
        return;
      }
      this.querySelector('[data-recommendations]').replaceWith(document.importNode(list, true));
      this.setAttribute('data-loaded', '');
    } catch {
      this.hidden = true;
    }
  }
}

for (const [name, element] of [
  ['product-gallery', ProductGallery],
  ['quantity-input', QuantityInput],
  ['sticky-buy-bar', StickyBuyBar],
  ['stock-notify', StockNotify],
  ['pickup-availability', PickupAvailability],
  ['delivery-estimate', DeliveryEstimate],
  ['share-button', ShareButton],
  ['product-recommendations', ProductRecommendations],
]) {
  if (!customElements.get(name)) customElements.define(name, element);
}

// Recently viewed: the product of this page
const info = document.querySelector('product-info[data-product-handle]');
if (info) recordView({ handle: info.dataset.productHandle });
