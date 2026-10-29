// <cart-item-state> for the headless storefront — the theme's element of the same name (theme/assets/cart.js),
// on the Storefront API cart. Plain markup, so it works in server-rendered cards and in HTML fragments
// swapped in by the shared modules (@ui/saved-pages):
//   <cart-item-state data-variant-id="gid…" | data-product-handle="…" data-label="%n in cart" [data-open-drawer]>
//     form (merchandiseId [, quantity]) — submit adds to the cart
//     [data-step="-1|1"] — changes the variant's line by one; [data-in-cart-label] — the label with %n
//   </cart-item-state>
// [data-in-cart] while the variant (or any of the product's variants) is in the cart.
import { addToCart, updateLine } from '@/app/actions.js';
import { onCart, openDrawer, publish, quantityIn } from './cart-client.js';

class CartItemState extends HTMLElement {
  #off;
  #cart = null;

  connectedCallback() {
    this.addEventListener('submit', this.#onSubmit);
    this.addEventListener('click', this.#onClick);
    this.#off = onCart((cart) => this.#render(cart));
  }

  disconnectedCallback() {
    this.removeEventListener('submit', this.#onSubmit);
    this.removeEventListener('click', this.#onClick);
    this.#off?.();
  }

  #render(cart) {
    this.#cart = cart;
    const count = quantityIn(cart, { variantId: this.dataset.variantId, productHandle: this.dataset.productHandle });
    this.toggleAttribute('data-in-cart', count > 0);
    const label = this.querySelector('[data-in-cart-label]');
    if (label && this.dataset.label) label.textContent = this.dataset.label.replace('%n', count);
  }

  async #run(action, open = false) {
    this.setAttribute('aria-busy', 'true');
    try {
      const cart = await action();
      if (cart) publish(cart);
      if (cart && open && this.hasAttribute('data-open-drawer')) openDrawer();
    } finally {
      this.removeAttribute('aria-busy');
    }
  }

  #onSubmit = (event) => {
    event.preventDefault();
    if (this.hasAttribute('aria-busy')) return;
    this.#run(() => addToCart(new FormData(event.target)), true);
  };

  #onClick = (event) => {
    const step = event.target.closest('[data-step]');
    if (!step || this.hasAttribute('aria-busy')) return;
    const line = this.#cart?.lines.nodes.find((item) => item.merchandise.id === this.dataset.variantId);
    if (line) this.#run(() => updateLine(line.id, line.quantity + Number(step.dataset.step)));
  };
}

if (!customElements.get('cart-item-state')) customElements.define('cart-item-state', CartItemState);
