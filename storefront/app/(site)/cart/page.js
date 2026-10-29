// Cart page: theme/sections/main-cart.liquid — heading, then the lines and the summary aside (free
// shipping, order details, promo codes, totals, checkout) and "You may also like" (CartPage).
// Per visitor: rendered on every request. Styles: packages/ui/css/cart.css (loaded by the layout).
import CartPage from '@/components/CartPage.js';
import CartUpsell from '@/components/CartUpsell.js';
import { getCart } from '@/lib/cart.js';
import { accountUrl } from '@/lib/shopify.js';
import { CART_STRINGS } from '@/lib/strings.js';
import { getSettings, orderDetails, strings, t } from '@/lib/theme.js';

export const metadata = { title: 'Cart', robots: { index: false } };

export default async function Page() {
  const cart = await getCart();
  const settings = getSettings();
  const threshold = settings.show_free_shipping !== false ? Number(settings.free_shipping_threshold) || 0 : 0;
  return (
    <div className="main-cart section-spacing">
      <div className="page-width">
        <h1 className="main-cart__title h2">{t('cart.heading')}</h1>
        <CartPage
          cart={cart}
          strings={strings(CART_STRINGS)}
          upsell={<CartUpsell modifier="page" />}
          loginUrl={accountUrl()}
          details={orderDetails('page')}
          threshold={threshold}
        />
      </div>
    </div>
  );
}
