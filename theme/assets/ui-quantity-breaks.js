/* Generated from packages/ui/js/quantity-breaks.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <quantity-breaks> — "Bundle & save" cards: buying 1 / 2 / 3 at once with a discount each.
 *
 * Markup contract (theme: the quantity_breaks block of sections/main-product.liquid):
 *   <quantity-breaks data-form="<product form id>">
 *     label > input[type=radio][value=<quantity>][data-discount=<percent>] … [data-break-each]
 *   </quantity-breaks>
 * Inside a <product-info data-money-format> (@ui/variant-picker):
 * - a picked card sets the quantity field of the form (the stepper), and the stepper picks the card
 *   of its quantity (none when there is no such card);
 * - on variant:change the prices per item follow the variant's price.
 * Without a stepper the radios themselves are the form's quantity (name="quantity" form="…"):
 * that works without JS too. The discount is applied by Shopify (an automatic discount), not here.
 */
import { formatMoney } from '@ui/money';

class QuantityBreaks extends HTMLElement {
  connectedCallback() {
    this.info = this.closest('product-info');
    this.radios = [...this.querySelectorAll('input[type="radio"]')];
    this.quantity = document.getElementById(this.dataset.form)?.querySelector('input[name="quantity"]');
    this.addEventListener('change', this.#onPick);
    this.quantity?.addEventListener('change', this.#onQuantity);
    this.info?.addEventListener('variant:change', (event) => this.#prices(event.detail.variant));
    // Back / forward may restore a picked card: the stepper follows it
    this.#onPick();
  }

  #onPick = () => {
    const picked = this.radios.find((radio) => radio.checked);
    if (picked && this.quantity && this.quantity.value !== picked.value) this.quantity.value = picked.value;
  };

  #onQuantity = () => {
    for (const radio of this.radios) radio.checked = radio.value === this.quantity.value;
  };

  #prices(variant) {
    if (!variant) return;
    const format = this.info?.dataset.moneyFormat;
    for (const radio of this.radios) {
      // Whole cents, rounded down as in Liquid
      const each = Math.floor((variant.price * (100 - Number(radio.dataset.discount))) / 100);
      radio.closest('label').querySelector('[data-break-each]').textContent = formatMoney(each, format);
    }
  }
}

if (!customElements.get('quantity-breaks')) customElements.define('quantity-breaks', QuantityBreaks);
