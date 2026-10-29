/**
 * Quick view: a click on a[data-quick-view] (product card "Choose options") opens #QuickView with the
 * <product-info> markup of that product, fetched as HTML:
 * - Shopify: the product URL with ?section_id=quick-view (sections/quick-view, Section Rendering API)
 * - with data-endpoint on the dialog (headless): <data-endpoint>/<handle>
 * Without JS the link opens the product page. After a successful add the popup closes: Liquid Ajax
 * Cart's request-end (theme) or `cart:add` ({ detail: { ok } }, bubbling from the form inside).
 * The variant picker module loads with the first quick view, not with every page. Only the latest
 * click renders; closing the popup while a product loads drops it (no render, no navigation).
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

function urlFor(link) {
  const endpoint = dialog.dataset.endpoint;
  if (!endpoint) return sectionUrl(link.href, 'quick-view');
  const handle = new URL(link.href).pathname.split('/products/')[1]?.split('/')[0] ?? '';
  return `${endpoint}/${handle}`;
}

document.addEventListener('click', async (event) => {
  const link = event.target.closest('a[data-quick-view]');
  if (!link || !dialog || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  const { signal, isCurrent } = requests.next();
  const url = urlFor(link);
  content.replaceChildren();
  dialog.setAttribute('aria-busy', 'true');
  openDialog(dialog, link);
  try {
    const [html] = await Promise.all([fetchHTML(url, { signal, cache }), import('@ui/variant-picker')]);
    const info = html.querySelector('product-info');
    if (!isCurrent() || closed()) return;
    if (!info) throw new Error('No quick view markup');
    content.replaceChildren(document.importNode(info, true));
  } catch (error) {
    if (error.name === 'AbortError' || !isCurrent() || closed()) return;
    cache.delete(url);
    window.location.href = link.href;
  } finally {
    if (isCurrent()) dialog.removeAttribute('aria-busy');
  }
});

dialog?.addEventListener('close', () => {
  requests.abort();
  dialog.removeAttribute('aria-busy');
});

// An add from inside the popup succeeded: close it (the cart then shows as set in Theme settings)
dialog?.addEventListener('cart:add', (event) => {
  if (event.detail?.ok) closeDialog(dialog);
});
document.addEventListener('liquid-ajax-cart:request-end', (event) => {
  const { requestState } = event.detail;
  if (requestState.requestType === 'add' && requestState.responseData?.ok && dialog?.contains(requestState.info?.initiator)) {
    closeDialog(dialog);
  }
});
