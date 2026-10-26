/**
 * Theme-only quick view: a click on a[data-quick-view] (product card "Choose options") opens
 * #QuickView (snippets/quick-view-dialog) with sections/quick-view for that product, fetched with
 * the Section Rendering API. Without JS the link opens the product page. After a successful add the
 * popup closes (cart.js then shows the cart as set in Theme settings).
 * The variant picker module loads with the first quick view, not with every page.
 * Headless storefronts render the same <product-info> markup from Storefront API data.
 */
import { openDialog, closeDialog } from '@ui/dialog';

const dialog = document.getElementById('QuickView');
const content = dialog?.querySelector('[data-quick-view-content]');
const cache = new Map();

async function load(url) {
    if (!cache.has(url)) {
        const sectionUrl = new URL(url, location.origin);
        sectionUrl.searchParams.set('section_id', 'quick-view');
        cache.set(url, fetch(sectionUrl).then((response) => (response.ok ? response.text() : Promise.reject(response))));
    }
    const html = new DOMParser().parseFromString(await cache.get(url), 'text/html');
    return html.querySelector('product-info');
}

document.addEventListener('click', async (event) => {
    const link = event.target.closest('a[data-quick-view]');
    if (!link || !dialog || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    content.replaceChildren();
    dialog.setAttribute('aria-busy', 'true');
    openDialog(dialog, link);
    try {
        const [info] = await Promise.all([load(link.href), import('@ui/variant-picker')]);
        if (!info) throw new Error('No quick view markup');
        content.replaceChildren(info);
    } catch {
        cache.delete(link.href);
        window.location.href = link.href;
    } finally {
        dialog.removeAttribute('aria-busy');
    }
});

document.addEventListener('liquid-ajax-cart:request-end', (event) => {
    const { requestState } = event.detail;
    if (requestState.requestType === 'add' && requestState.responseData?.ok && dialog?.contains(requestState.info?.initiator)) {
        closeDialog(dialog);
    }
});
