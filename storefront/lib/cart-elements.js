// <cart-item-state> for the headless storefront — the theme's element of the same name (theme/assets/cart.js),
// on the Storefront API cart. Plain markup, so it works in server-rendered cards and in HTML fragments
// swapped in by the shared modules (@ui/saved-pages, @ui/quick-view):
//   <cart-item-state data-variant-id="<gid or numeric id>" | data-product-handle="…" data-label="%n in cart"
//                    [data-open-drawer]>
//     form (merchandiseId or id [, quantity]) — submit adds to the cart
//     [data-step="-1|1"] — changes the variant's line by one; [data-in-cart-label] — the label with %n
//   </cart-item-state>
// [data-in-cart] while the variant (or any of the product's variants) is in the cart. Inside a
// <product-info>, data-variant-id follows the picked variant (variant:change). After an add it
// dispatches cart:add ({ detail: { ok } }, bubbles): the quick view closes on it.
import { addToCart, buyNow, setDiscountCodes, updateLine } from '@/app/actions.js';
import { onCart, openDrawer, publish, quantityIn } from './cart-client.js';
import { numericId, variantGid as gid } from './ids.js';

const ADDED_FOR = 2000;
const addedTimers = new WeakMap();

// The added line, once the cart has re-rendered it: a short flash ([data-just-added], cart.css)
function flashLine(lineId) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      for (const row of document.querySelectorAll(`[data-cart-line="${CSS.escape(lineId)}"]`)) {
        row.setAttribute('data-just-added', '');
        row.addEventListener('animationend', () => row.removeAttribute('data-just-added'), { once: true });
      }
    })
  );
}

class CartItemState extends HTMLElement {
  #abort;
  #off;
  #cart = null;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('submit', this.#onSubmit, { signal });
    this.addEventListener('click', this.#onClick, { signal });
    this.closest('product-info')?.addEventListener('variant:change', this.#onVariantChange, { signal });
    this.#off = onCart((cart) => this.#render(cart));
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#off?.();
  }

  get #variantId() {
    return gid(this.dataset.variantId);
  }

  #render(cart) {
    this.#cart = cart;
    const count = quantityIn(cart, { variantId: this.#variantId, productHandle: this.dataset.productHandle });
    this.toggleAttribute('data-in-cart', count > 0);
    const label = this.querySelector('[data-in-cart-label]');
    if (label && this.dataset.label) label.textContent = this.dataset.label.replace('%n', count);
  }

  // Runs a cart action (the element busy meanwhile); returns the new cart (null when it failed)
  async #run(action, added = false) {
    this.setAttribute('aria-busy', 'true');
    try {
      const cart = await action();
      if (cart) publish(cart);
      if (added) this.dispatchEvent(new CustomEvent('cart:add', { bubbles: true, detail: { ok: Boolean(cart) } }));
      if (cart && added && this.hasAttribute('data-open-drawer')) openDrawer();
      return cart;
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  // As the theme's add buttons (cart.js): a spinner on the button while the item is added, then "Added"
  // for a moment (.btn[data-added] .btn__state--done) and a flash on its line in the cart
  #onSubmit = async (event) => {
    event.preventDefault();
    if (this.hasAttribute('aria-busy')) return;
    const data = new FormData(event.target);
    if (!data.get('merchandiseId')) data.set('merchandiseId', gid(data.get('id')));
    const button = event.target.querySelector('[type="submit"]');
    button?.setAttribute('aria-busy', 'true');
    let cart = null;
    try {
      cart = await this.#run(() => addToCart(data), true);
    } finally {
      button?.removeAttribute('aria-busy');
    }
    if (!cart) return;
    if (button) {
      button.setAttribute('data-added', '');
      clearTimeout(addedTimers.get(button));
      addedTimers.set(
        button,
        setTimeout(() => button.removeAttribute('data-added'), ADDED_FOR)
      );
    }
    const line = cart.lines.nodes.find((item) => item.merchandise.id === data.get('merchandiseId'));
    if (line) flashLine(line.id);
  };

  #onClick = (event) => {
    // "Buy it now" ([data-buy-now] in the form): this line alone, straight to checkout
    const buy = event.target.closest('[data-buy-now]');
    if (buy && !this.hasAttribute('aria-busy')) {
      const data = new FormData(buy.form ?? this.querySelector('form'));
      if (!data.get('merchandiseId')) data.set('merchandiseId', gid(data.get('id')));
      this.setAttribute('aria-busy', 'true');
      buyNow(data)
        .then((url) => location.assign(url))
        .catch(() => this.removeAttribute('aria-busy'));
      return;
    }
    const step = event.target.closest('[data-step]');
    if (!step || this.hasAttribute('aria-busy')) return;
    const line = this.#cart?.lines.nodes.find((item) => item.merchandise.id === this.#variantId);
    if (line) this.#run(() => updateLine(line.id, line.quantity + Number(step.dataset.step)));
  };

  #onVariantChange = (event) => {
    this.dataset.variantId = event.detail.variant?.id ?? '';
    this.#render(this.#cart);
  };
}

if (!customElements.get('cart-item-state')) customElements.define('cart-item-state', CartItemState);

// Variant pickers (product page, quick view), as the theme's cart.js: a value whose variant — with the
// other current picks — is in the cart gets [data-in-cart] on its label (a check mark, components.css)
function markPickers(current) {
  const inCart = new Set(current?.lines.nodes.map((line) => numericId(line.merchandise.id)));
  document.querySelectorAll('variant-picker').forEach((picker) => {
    if (!picker.variants) return;
    const selected = picker.selected;
    picker.querySelectorAll('fieldset').forEach((fieldset, i) => {
      fieldset.querySelectorAll('input').forEach((input) => {
        const options = selected.with(i, input.value);
        const variant = picker.variants.find((item) => item.options.every((value, j) => value === options[j]));
        input.closest('label').toggleAttribute('data-in-cart', Boolean(variant && inCart.has(Number(variant.id))));
      });
    });
  });
}

// Discount codes from the promos, as the theme's cart.js: discount:apply ({ detail: { code } }, the Spin to
// win wheel) and a newsletter sign-up with a discount (newsletter:subscribed, detail.discount) add the code
// to the cart; discount:result ({ detail: { code, applicable } }) tells whether it applies to this cart.
let cart = null;
onCart((next) => {
  cart = next;
  markPickers(cart);
});
for (const type of ['variant:change', 'variant-picker:connect']) document.addEventListener(type, () => markPickers(cart));

async function applyCode(code) {
  if (!code) return;
  const codes = (cart?.discountCodes ?? []).filter((item) => item.applicable).map((item) => item.code);
  const next = await setDiscountCodes([...new Set([...codes, code])]).catch(() => null);
  if (next) publish(next);
  const applicable = Boolean(next?.discountCodes.some((item) => item.code.toLowerCase() === code.toLowerCase() && item.applicable));
  document.dispatchEvent(new CustomEvent('discount:result', { detail: { code, applicable } }));
}

document.addEventListener('discount:apply', (event) => applyCode(event.detail?.code));
document.addEventListener('newsletter:subscribed', (event) => applyCode(event.detail?.discount));
