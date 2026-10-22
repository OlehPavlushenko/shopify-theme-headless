/**
 * Cart behavior on top of Liquid Ajax Cart v2 (https://liquid-ajax-cart.js.org/).
 *
 * Liquid Ajax Cart re-renders every [data-ajax-cart-section] after each Cart API request, so cart
 * markup, totals and the free-shipping bar stay in Liquid. This module only decides what happens
 * after a product is added (Theme settings > Cart > "After adding to cart"):
 * - drawer: open #CartDrawer
 * - notification: fill and open #CartNotification with the added item
 * - page: go to the cart page
 * Settings arrive via window.theme.cart, printed in layout/theme.liquid.
 * Money is never formatted by Liquid Ajax Cart bindings: totals render in Liquid inside the
 * re-rendered sections, so the store's money format is always exact.
 */
import 'liquid-ajax-cart';
import { openDialog } from 'dialog';

const settings = window.theme?.cart ?? {};

function formatMoney(cents, format = settings.moneyFormat || '${{amount}}') {
    const value = Number(cents) / 100;
    const formats = {
        amount: [2, ',', '.'],
        amount_no_decimals: [0, ',', '.'],
        amount_with_comma_separator: [2, '.', ','],
        amount_no_decimals_with_comma_separator: [0, '.', ','],
        amount_with_apostrophe_separator: [2, "'", '.'],
        amount_with_space_separator: [2, ' ', ','],
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
        const [decimals, thousands, decimal] = formats[key] ?? formats.amount;
        const [int, frac] = value.toFixed(decimals).split('.');
        return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (frac ? decimal + frac : '');
    });
}

function showNotification(items) {
    const dialog = document.getElementById('CartNotification');
    if (!dialog || !items.length) return false;
    const item = items[0];
    const set = (field, value) => {
        dialog.querySelectorAll(`[data-notification="${field}"]`).forEach((el) => {
            el.textContent = value ?? '';
            el.hidden = !value;
        });
    };
    set('title', item.product_title);
    set('variant', item.product_has_only_default_variant ? '' : item.variant_title);
    set('price', formatMoney(item.final_line_price));
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
