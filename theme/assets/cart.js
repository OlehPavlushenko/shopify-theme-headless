/**
 * Theme-only cart adapter on top of Liquid Ajax Cart v2 (https://liquid-ajax-cart.js.org/).
 *
 * Liquid Ajax Cart re-renders every [data-ajax-cart-section] after each Cart API request, so cart
 * markup, totals and the free-shipping bar stay in Liquid. This module only decides what happens
 * after a product is added (Theme settings > Cart > "After adding to cart"):
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
