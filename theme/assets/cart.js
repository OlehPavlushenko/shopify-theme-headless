/**
 * Theme-only cart adapter on top of Liquid Ajax Cart v2 (https://liquid-ajax-cart.js.org/).
 *
 * Liquid Ajax Cart re-renders every [data-ajax-cart-section] after each Cart API request, so cart
 * markup, totals and the free-shipping bar stay in Liquid. This module runs the promo code field
 * (<cart-discount>) and decides what happens after a product is added
 * (Theme settings > Cart > "After adding to cart"):
 * - drawer: open #CartDrawer
 * - notification: fill and open #CartNotification with the added item
 * - page: go to the cart page
 * Headless storefronts replace this file with a Storefront API cart; @ui/* modules are shared.
 */
import 'liquid-ajax-cart';
import { openDialog } from '@ui/dialog';
import { formatMoney } from '@ui/money';

const settings = window.theme?.cart ?? {};

function showNotification(items) {
    const dialog = document.getElementById('CartNotification');
    if (!dialog || !items.length) return false;
    const [item] = items;
    const set = (field, value) => {
        dialog.querySelectorAll(`[data-notification="${field}"]`).forEach((el) => {
            el.textContent = value ?? '';
            el.hidden = !value;
        });
    };
    set('title', item.product_title);
    set('variant', item.product_has_only_default_variant ? '' : item.variant_title);
    set('price', formatMoney(item.final_line_price, settings.moneyFormat));
    set('quantity', items.length > 1 ? `+${items.length - 1}` : '');
    const image = dialog.querySelector('[data-notification="image"]');
    if (image) {
        image.hidden = !item.image;
        if (item.image) {
            const url = new URL(item.image, location.origin);
            url.searchParams.set('width', '240');
            image.src = url.toString();
            image.alt = item.product_title;
        }
    }
    openDialog(dialog);
    return true;
}

/**
 * <cart-discount> — promo codes (snippets/cart-discount.liquid).
 * Shopify replaces the cart's codes with the `discount` list sent to /cart/update.js, so apply sends
 * the current codes plus the new one and remove sends the rest. Liquid Ajax Cart re-renders the cart
 * sections afterwards, which replaces this element; the open state of its <details> and the last
 * error survive re-renders. A code Shopify reports as not applicable is removed from the cart again
 * (so it doesn't reach checkout) and shown as an error.
 */
const discount = { open: false, pending: false, error: '' };

class CartDiscount extends HTMLElement {
    connectedCallback() {
        this.details = this.querySelector('details');
        this.input = this.querySelector('[data-discount-input]');
        if (this.details && discount.open) this.details.open = true;
        this.details?.addEventListener('toggle', () => (discount.open = this.details.open));
        const error = this.querySelector('[data-discount-error]');
        if (error) error.textContent = discount.error ? error.dataset.message.replace('__code__', discount.error) : '';
        this.addEventListener('click', this.#onClick);
        this.input?.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter') return;
            event.preventDefault(); // inside the cart form: Enter must not submit it
            this.#apply();
        });
    }

    get #codes() {
        return [...this.querySelectorAll('[data-discount-remove]')].map((el) => el.dataset.discountRemove);
    }

    #onClick = (event) => {
        if (event.target.closest('[data-discount-apply]')) this.#apply();
        const remove = event.target.closest('[data-discount-remove]');
        if (remove) this.#send(this.#codes.filter((code) => code !== remove.dataset.discountRemove));
    };

    #apply() {
        const code = this.input?.value.trim();
        if (!code) return this.input?.focus();
        const codes = this.#codes;
        if (!codes.some((c) => c.toLowerCase() === code.toLowerCase())) codes.push(code);
        this.#send(codes);
    }

    #send(codes) {
        this.setAttribute('aria-busy', 'true');
        discount.error = '';
        discount.pending = true;
        window.liquidAjaxCart.update({ discount: codes.join(',') });
    }
}

if (!customElements.get('cart-discount')) customElements.define('cart-discount', CartDiscount);

// After a promo code request: drop codes that don't apply and remember the first one for the error
document.addEventListener('liquid-ajax-cart:request-end', (event) => {
    const { requestState } = event.detail;
    if (!discount.pending || requestState.requestType !== 'update') return;
    discount.pending = false;
    const codes = requestState.responseData?.body?.discount_codes ?? [];
    const invalid = codes.filter((c) => !c.applicable);
    if (!invalid.length) return;
    discount.error = invalid[0].code;
    window.liquidAjaxCart.update({ discount: codes.filter((c) => c.applicable).map((c) => c.code).join(',') });
});

document.addEventListener('liquid-ajax-cart:request-end', (event) => {
    const { requestState } = event.detail;
    if (requestState.requestType !== 'add' || !requestState.responseData?.ok) return;

    if (settings.type === 'page') {
        window.location.href = settings.cartUrl;
        return;
    }

    if (settings.type === 'notification') {
        const body = requestState.responseData.body;
        if (showNotification(body.items ?? [body])) return;
    }

    openDialog(document.getElementById('CartDrawer'));
});
