/**
 * Behavior of the product page (the theme's sections/main-product and its neighbours; the headless
 * product page renders the same markup).
 *
 * <product-gallery data-layout="grid|thumbnails|stacked">
 *   [data-gallery-track] > [data-media-id] items; [data-gallery-current] counter (phones, thumbnails);
 *   [data-thumb="<i>"] thumbnails; [data-zoom="<i>"] opens the lightbox (#Lightbox-…) at that image.
 *   On a variant change (from <product-info>): the slider scrolls to the variant's image; the grid
 *   and the stacked layout move it to the top on wide screens.
 * <quantity-input>: − / + buttons around a number input.
 * <sticky-buy-bar data-form="<product form id>" hidden>: shown once the main add button has scrolled
 *   up out of view (<body data-sticky-buy> meanwhile: the page reserves room for it). Shows what the form adds: [data-sticky-variant] the variant's options,
 *   [data-sticky-count] "× N" (phones), [data-sticky-qty] a stepper both ways in step with the
 *   form's quantity (a stepper or the "Bundle & save" radios). [data-sticky-top] (an up arrow)
 *   scrolls back up to the variant picker (else the product's head) and focuses the picked value.
 * <delivery-estimate data-min data-max data-cutoff data-template data-template-today data-locale>:
 *   "Order within 3 h — delivered Thu 29 Oct – Mon 2 Nov" (business days, today's cut-off hour).
 * <stock-notify hidden>: the back-in-stock form, shown for sold-out variants only.
 * <variant-fields data-product="<title>">: parts of a form that follow the variant — [data-variant-id]
 *   gets its id, [data-variant-title] "Product / Variant" (an input's value, else its text).
 * <pickup-availability data-root>: on a variant change, fetches the pickup info of that variant
 *   (/variants/<id>/?section_id=pickup-availability) into itself; only the latest variant's answer
 *   renders (a slower one for an earlier pick is dropped).
 * <share-button data-url data-title data-copied>: the system share sheet, else copies the link
 *   ([data-share-label] says data-copied for a moment, only when it was copied).
 * <product-recommendations data-url [data-replace]>: fetched once it nears the viewport; fills
 *   its [data-recommendations] (or, with data-replace, swaps itself for the response); hidden when
 *   empty.
 * Records the product in the recently viewed list (@ui/saved-list). Scrolling is instant with
 * "reduce motion" (@ui/scroll).
 */
import { copyText, flashLabel } from '@ui/clipboard';
import { deliveryDates, formatLeft } from '@ui/delivery';
import { openDialog } from '@ui/dialog';
import { fetchHTML, importChildren, latest, sectionUrl } from '@ui/fetch-html';
import { recordView } from '@ui/saved-list';
import { scrollBehavior } from '@ui/scroll';
import { variantTitle } from '@ui/variant-picker';

const wide = matchMedia('(min-width: 990px)');

class ProductGallery extends HTMLElement {
  #abort;
  #ticking = false;
  #track;
  #counter;

  connectedCallback() {
    this.#track = this.querySelector('[data-gallery-track]');
    this.#counter = this.querySelector('[data-gallery-current]');
    const { signal } = (this.#abort = new AbortController());
    this.#track.addEventListener('scroll', this.#onScroll, { passive: true, signal });
    this.addEventListener('click', this.#onClick, { signal });
    this.closest('product-info')?.addEventListener('variant:change', this.#onVariantChange, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  get #items() {
    return [...this.#track.children];
  }

  #onVariantChange = (event) => this.#show(event.detail.variant?.featured_media?.id);

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      const { scrollLeft, clientWidth } = this.#track;
      const index = Math.round(scrollLeft / clientWidth);
      if (this.#counter) this.#counter.textContent = index + 1;
      this.querySelectorAll('[data-thumb]').forEach((thumb, i) => thumb.toggleAttribute('aria-current', i === index));
    });
  };

  #onClick = (event) => {
    const thumb = event.target.closest('[data-thumb]');
    if (thumb) {
      const item = this.#items[Number(thumb.dataset.thumb)];
      this.#track.scrollTo({ left: item.offsetLeft - this.#track.offsetLeft, behavior: scrollBehavior() });
      this.querySelectorAll('[data-thumb]').forEach((other) => other.toggleAttribute('aria-current', other === thumb));
      return;
    }
    const zoom = event.target.closest('[data-zoom]');
    if (zoom) this.#zoom(zoom.closest('[data-media-id]'));
  };

  #show(mediaId) {
    const item = mediaId && this.#track.querySelector(`[data-media-id="${mediaId}"]`);
    if (!item) return;
    const layout = this.dataset.layout;
    if (wide.matches && (layout === 'grid' || layout === 'stacked')) {
      this.#track.prepend(item);
      return;
    }
    this.#track.scrollTo({ left: item.offsetLeft - this.#track.offsetLeft, behavior: scrollBehavior() });
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
  #abort;
  #input;

  connectedCallback() {
    this.#input = this.querySelector('input');
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('click', this.#onClick, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onClick = (event) => {
    const step = event.target.closest('[data-qty]');
    if (!step) return;
    const min = Number(this.#input.min) || 1;
    this.#input.value = Math.max(min, (Number(this.#input.value) || min) + Number(step.dataset.qty));
    this.#input.dispatchEvent(new Event('change', { bubbles: true }));
  };
}

class StockNotify extends HTMLElement {
  #abort;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.closest('product-info')?.addEventListener('variant:change', this.#onVariantChange, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onVariantChange = (event) => {
    const variant = event.detail.variant;
    this.hidden = !variant || variant.available;
  };
}

class VariantFields extends HTMLElement {
  #abort;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.closest('product-info')?.addEventListener('variant:change', this.#onVariantChange, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onVariantChange = (event) => {
    const variant = event.detail.variant;
    if (!variant) return;
    // The variant's title, as in Liquid ("Product / Variant"; the product alone without options)
    const name = variantTitle(variant);
    const title = this.dataset.product + (name ? ` / ${name}` : '');
    for (const field of this.querySelectorAll('[data-variant-id]')) field.value = variant.id;
    for (const field of this.querySelectorAll('[data-variant-title]')) {
      if (field instanceof HTMLInputElement) field.value = title;
      else field.textContent = title;
    }
  };
}

class PickupAvailability extends HTMLElement {
  #abort;
  #requests = latest();

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.closest('product-info')?.addEventListener('variant:change', this.#onVariantChange, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#requests.abort();
  }

  #onVariantChange = async (event) => {
    const id = event.detail.variant?.id;
    if (!id) return;
    // A newer pick wins: the request before is aborted, a late answer for it ignored
    const { signal, isCurrent } = this.#requests.next();
    try {
      const html = await fetchHTML(sectionUrl(`${this.dataset.root.replace(/\/$/, '')}/variants/${id}/`, 'pickup-availability'), {
        signal,
      });
      if (!isCurrent()) return;
      const content = html.querySelector('[data-pickup-content]');
      if (content) this.replaceChildren(...importChildren(content));
    } catch {
      // Keeps what it shows
    }
  };
}

class StickyBuyBar extends HTMLElement {
  #abort;
  #observer;
  #info;
  #form;
  #qty;

  connectedCallback() {
    this.#info = this.closest('product-info');
    const button = this.#info?.querySelector('[data-product-form] [data-add-button]');
    if (!button) return;
    this.#observer = new IntersectionObserver(([entry]) => {
      // Visible once the main button is above the viewport (not while it is still below it)
      this.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
      document.body.toggleAttribute('data-sticky-buy', !this.hidden);
    });
    this.#observer.observe(button);

    const { signal } = (this.#abort = new AbortController());
    this.querySelector('[data-sticky-top]')?.addEventListener('click', this.#onTop, { signal });

    this.#form = document.getElementById(this.dataset.form);
    this.#qty = this.querySelector('[data-sticky-qty]');
    // The bar's stepper sets the form's quantity (the "Bundle & save" card follows it)
    this.#qty?.addEventListener('change', this.#onQtyChange, { signal });
    this.#info.addEventListener('change', this.#onFormChange, { signal });
    this.#info.addEventListener('variant:change', this.#onVariantChange, { signal });
    this.#count();
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    document.body.removeAttribute('data-sticky-buy');
  }

  #onTop = () => {
    const target = this.#info.querySelector('variant-picker') ?? this.#info.querySelector('.main-product__head') ?? this.#info;
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'center' });
    target.querySelector('input:checked')?.focus({ preventScroll: true });
  };

  #onQtyChange = (event) => {
    event.stopPropagation();
    const quantity = this.#form?.querySelector('input[name="quantity"]:not([type="radio"])');
    if (!quantity) return;
    quantity.value = this.#qty.value;
    quantity.dispatchEvent(new Event('change', { bubbles: true }));
  };

  #onFormChange = () => this.#count();

  #onVariantChange = (event) => {
    const name = variantTitle(event.detail.variant);
    const label = this.querySelector('[data-sticky-variant]');
    if (label && name) label.textContent = name;
  };

  // The form's quantity (stepper or picked card) into the bar
  #count() {
    const quantity = Number(new FormData(this.#form ?? undefined).get('quantity')) || 1;
    if (this.#qty) this.#qty.value = quantity;
    const count = this.querySelector('[data-sticky-count]');
    count.textContent = `× ${quantity}`;
    count.hidden = quantity < 2;
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
  #abort;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.querySelector('button').addEventListener('click', this.#onClick, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onClick = async () => {
    const { url, title, copied } = this.dataset;
    if (navigator.share) {
      try {
        await navigator.share({ url, title });
      } catch {
        // Cancelled
      }
      return;
    }
    if (await copyText(url)) flashLabel(this.querySelector('[data-share-label]'), copied);
  };
}

class ProductRecommendations extends HTMLElement {
  #observer;

  connectedCallback() {
    if (this.hasAttribute('data-loaded')) return; // the fetched copy that replaced the shell
    this.#observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        this.#observer.disconnect();
        this.#load();
      },
      { rootMargin: '600px 0px' }
    );
    this.#observer.observe(this);
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  async #load() {
    try {
      const html = await fetchHTML(this.dataset.url);
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
  ['variant-fields', VariantFields],
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
