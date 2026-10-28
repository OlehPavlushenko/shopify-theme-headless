/**
 * Theme-only quick view: a click on a[data-quick-view] (product card "Choose options") opens
 * #QuickView (snippets/quick-view-dialog) with sections/quick-view for that product, fetched with
 * the Section Rendering API. Without JS the link opens the product page. After a successful add the
 * popup closes (cart.js then shows the cart as set in Theme settings).
 * The variant picker module loads with the first quick view, not with every page. Only the latest
 * click renders; closing the popup while a product loads drops it (no render, no navigation).
 * Headless storefronts render the same <product-info> markup from Storefront API data.
 */
import { openDialog, closeDialog } from '@ui/dialog';
import { fetchHTML, latest, sectionUrl } from '@ui/fetch-html';

const dialog = document.getElementById('QuickView');
const content = dialog?.querySelector('[data-quick-view-content]');
const cache = new Map();
// Only the latest product opens: a click on another one (or closing the popup) drops the one before
const requests = latest();

// Closed (or closing) while its product loaded: nothing renders, nothing navigates
const closed = () => !dialog.open || dialog.hasAttribute('data-closing');

async function load(url, signal) {
  const html = await fetchHTML(sectionUrl(url, 'quick-view'), { signal, cache });
  return html.querySelector('product-info');
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('a[data-quick-view]');
  if (!link || !dialog || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  const { signal, isCurrent } = requests.next();
  content.replaceChildren();
  dialog.setAttribute('aria-busy', 'true');
  openDialog(dialog, link);
  try {
    const [info] = await Promise.all([load(link.href, signal), import('@ui/variant-picker')]);
    if (!isCurrent() || closed()) return;
    if (!info) throw new Error('No quick view markup');
    content.replaceChildren(info);
  } catch (error) {
    if (error.name === 'AbortError' || !isCurrent() || closed()) return;
    cache.delete(sectionUrl(link.href, 'quick-view'));
    window.location.href = link.href;
  } finally {
    if (isCurrent()) dialog.removeAttribute('aria-busy');
  }
});

dialog?.addEventListener('close', () => {
  requests.abort();
  dialog.removeAttribute('aria-busy');
});

document.addEventListener('liquid-ajax-cart:request-end', (event) => {
  const { requestState } = event.detail;
  if (requestState.requestType === 'add' && requestState.responseData?.ok && dialog?.contains(requestState.info?.initiator)) {
    closeDialog(dialog);
  }
});
