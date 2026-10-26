/* Generated from packages/ui/js/variant-picker.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <variant-picker> — linked option pickers, and <product-info> — the product block that follows them.
 *
 * Markup contract (Liquid: theme/snippets/variant-picker.liquid, theme/sections/quick-view.liquid):
 *   <product-info data-money-format="{{amount}} ₴" data-label-add data-label-sold-out data-label-unavailable>
 *     [data-media-id="<id>"] items (scrolled into view for the variant's image)
 *     .price-tag > .price-tag__current + .price-tag__compare > [data-compare-value]
 *     [data-discount-badge] ("−X%", hidden when the variant isn't discounted)
 *     <variant-picker>
 *       <fieldset> per option: [data-selected-value] in the legend, radio inputs in labels
 *       <script type="application/json" data-variants> [Shopify variant objects] </script>
 *     </variant-picker>
 *     form: input[name="id"], [data-add-button] > [data-add-label]
 *     [data-product-link] (gets ?variant=)
 *   </product-info>
 *
 * Linked options: for every value the picker checks the variant made of that value plus the other
 * current picks — none: [data-missing] on its label, not available: [data-sold-out]. Picking a value
 * whose combination doesn't exist keeps that value and switches the other options to the closest
 * variant (available first, then the most matching options). A change fires `variant:change`
 * ({ detail: { variant } }, bubbles); <product-info> updates price, form, button, media and link.
 * `variant-picker:connect` (bubbles) tells the page a picker appeared (e.g. to mark values in the cart).
 * Plain data in, DOM out: a headless storefront feeds the same JSON shape.
 */
import { formatMoney, discountPercent } from '@ui/money';

class VariantPicker extends HTMLElement {
  connectedCallback() {
    this.variants = JSON.parse(this.querySelector('[data-variants]').textContent);
    this.fieldsets = [...this.querySelectorAll('fieldset')];
    this.addEventListener('change', (event) => this.#pick(event.target));
    this.#update(false);
    this.dispatchEvent(new CustomEvent('variant-picker:connect', { bubbles: true }));
  }

  get selected() {
    return this.fieldsets.map((fieldset) => fieldset.querySelector('input:checked')?.value);
  }

  #find(options) {
    return this.variants.find((variant) => variant.options.every((value, i) => value === options[i]));
  }

  #pick(input) {
    const index = this.fieldsets.findIndex((fieldset) => fieldset.contains(input));
    const options = this.selected;
    if (!this.#find(options)) {
      const score = (variant) => (variant.available ? 10 : 0) + variant.options.filter((value, i) => value === options[i]).length;
      const closest = this.variants.filter((variant) => variant.options[index] === options[index]).sort((a, b) => score(b) - score(a))[0];
      closest?.options.forEach((value, i) => {
        const radio = [...this.fieldsets[i].querySelectorAll('input')].find((item) => item.value === value);
        if (radio) radio.checked = true;
      });
    }
    this.#update(true);
  }

  #update(notify) {
    const options = this.selected;
    this.fieldsets.forEach((fieldset, i) => {
      fieldset.querySelector('[data-selected-value]').textContent = options[i] ?? '';
      fieldset.querySelectorAll('input').forEach((input) => {
        const match = this.#find(options.with(i, input.value));
        const label = input.closest('label');
        label.toggleAttribute('data-missing', !match);
        label.toggleAttribute('data-sold-out', Boolean(match && !match.available));
      });
    });
    this.variant = this.#find(options);
    if (notify) this.dispatchEvent(new CustomEvent('variant:change', { bubbles: true, detail: { variant: this.variant } }));
  }
}

class ProductInfo extends HTMLElement {
  connectedCallback() {
    this.addEventListener('variant:change', (event) => this.#render(event.detail.variant));
    // Start on the selected variant's image (the picker connects after this element)
    requestAnimationFrame(() => this.#showMedia(this.querySelector('variant-picker')?.variant, 'instant'));
  }

  #showMedia(variant, behavior = 'smooth') {
    const media = variant?.featured_media && this.querySelector(`[data-media-id="${variant.featured_media.id}"]`);
    media?.parentElement.scrollTo({ left: media.offsetLeft - media.parentElement.offsetLeft, behavior });
  }

  #render(variant) {
    const format = this.dataset.moneyFormat;
    const price = this.querySelector('.price-tag');
    if (price && variant) {
      const sale = variant.compare_at_price > variant.price;
      price.classList.toggle('price-tag--sale', sale);
      price.querySelector('.price-tag__current').textContent = formatMoney(variant.price, format);
      const compare = price.querySelector('.price-tag__compare');
      if (compare) {
        compare.hidden = !sale;
        compare.querySelector('[data-compare-value]').textContent = sale ? formatMoney(variant.compare_at_price, format) : '';
      }
      const badge = this.querySelector('[data-discount-badge]');
      if (badge) {
        badge.hidden = !sale;
        if (sale) badge.textContent = `−${discountPercent(variant.price, variant.compare_at_price)}%`;
      }
    }

    const input = this.querySelector('input[name="id"]');
    if (input && variant) input.value = variant.id;

    const button = this.querySelector('[data-add-button]');
    if (button) {
      button.disabled = !variant?.available;
      const label = !variant ? this.dataset.labelUnavailable : variant.available ? this.dataset.labelAdd : this.dataset.labelSoldOut;
      button.querySelector('[data-add-label]').textContent = label;
    }

    const link = this.querySelector('[data-product-link]');
    if (link && variant) {
      const url = new URL(link.href, location.origin);
      url.searchParams.set('variant', variant.id);
      link.href = url.pathname + url.search;
    }

    this.#showMedia(variant);
  }
}

if (!customElements.get('variant-picker')) customElements.define('variant-picker', VariantPicker);
if (!customElements.get('product-info')) customElements.define('product-info', ProductInfo);
