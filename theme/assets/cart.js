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

/**
 * <cart-recommendations> — related products for what is in the cart, next to the cart drawer.
 * - Loads only while the drawer is open: on open and after cart changes.
 * - Seeds: the 3 newest products in the cart. Each seed's list comes from the Product
 *   Recommendations API (intent=related, rendered by sections/cart-recommendations) and is cached
 *   per product for the session, so quantity changes and re-opening cost no requests.
 * - Lists are mixed round-robin (1st of A, 1st of B, 1st of C, 2nd of A…), without products that
 *   are in the cart or already in the drawer's own "You may also like" list; 4 at most.
 * - Slides in a moment after the drawer; the close button hides it until the cart's products change.
 */
const RECS_LIMIT = 4;
const RECS_DELAY = 700;

class CartRecommendations extends HTMLElement {
    #cache = new Map();
    #key = '';
    #dismissed = false;
    #timer;

    connectedCallback() {
        this.list = this.querySelector('[data-recs-list]');
        this.dialog = this.closest('dialog');
        if (!this.list || !this.dialog || !settings.recommendationsUrl) return;
        this.dialog.addEventListener('dialog:open', () => this.#refresh(RECS_DELAY));
        this.dialog.addEventListener('close', () => this.#toggle(false));
        this.querySelector('[data-recs-close]')?.addEventListener('click', () => {
            this.#dismissed = true;
            this.#toggle(false);
        });
        document.addEventListener('liquid-ajax-cart:request-end', () => {
            if (this.dialog.open) this.#refresh(0);
        });
    }

    async #refresh(delay) {
        const items = window.liquidAjaxCart?.cart?.items ?? [];
        const inCart = new Set(items.map((item) => item.product_id));
        const seeds = [...inCart].slice(0, 3);
        const key = seeds.join(',');
        if (key !== this.#key) {
            this.#key = key;
            this.#dismissed = false;
        }
        if (!seeds.length || this.#dismissed) return this.#toggle(false);

        const lists = await Promise.all(seeds.map((id) => this.#load(id)));
        const skip = new Set([
            ...inCart,
            ...[...this.dialog.querySelectorAll('.cart-upsell [data-product-id]')].map((el) => Number(el.dataset.productId)),
        ]);
        const picked = [];
        for (let i = 0; picked.length < RECS_LIMIT && lists.some((list) => i < list.length); i++) {
            for (const list of lists) {
                const row = list[i];
                if (!row || skip.has(row.id) || picked.length >= RECS_LIMIT) continue;
                skip.add(row.id);
                picked.push(row);
            }
        }
        if (!picked.length) return this.#toggle(false);

        this.list.innerHTML = picked.map((row) => row.html).join('');
        clearTimeout(this.#timer);
        this.#timer = setTimeout(() => this.dialog.open && this.#toggle(true), delay);
    }

    async #load(productId) {
        const storageKey = `cart-recs:${productId}`;
        if (!this.#cache.has(productId)) {
            let stored = null;
            try {
                stored = JSON.parse(sessionStorage.getItem(storageKey));
            } catch {}
            this.#cache.set(productId, stored ? Promise.resolve(stored) : this.#fetch(productId, storageKey));
        }
        return this.#cache.get(productId);
    }

    async #fetch(productId, storageKey) {
        try {
            const url = new URL(settings.recommendationsUrl, location.origin);
            url.search = new URLSearchParams({ product_id: productId, limit: 6, intent: 'related', section_id: 'cart-recommendations' });
            const response = await fetch(url);
            if (!response.ok) return [];
            const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
            const rows = [...doc.querySelectorAll('[data-product-id]')].map((el) => ({ id: Number(el.dataset.productId), html: el.outerHTML }));
            try {
                sessionStorage.setItem(storageKey, JSON.stringify(rows));
            } catch {}
            return rows;
        } catch {
            return [];
        }
    }

    #toggle(open) {
        if (!open) clearTimeout(this.#timer);
        this.toggleAttribute('data-open', open);
        this.inert = !open;
    }
}

if (!customElements.get('cart-recommendations')) customElements.define('cart-recommendations', CartRecommendations);

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
