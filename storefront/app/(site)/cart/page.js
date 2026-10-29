// Cart page: theme/sections/main-cart.liquid — heading, then the lines and the summary aside (CartPage).
// Per visitor: rendered on every request. Styles: packages/ui/css/cart.css (loaded by the layout).
import CartPage from '@/components/CartPage.js';
import { getCart } from '@/lib/cart.js';
import { CART_STRINGS } from '@/lib/strings.js';
import { strings, t } from '@/lib/theme.js';

export const metadata = { title: 'Cart', robots: { index: false } };

export default async function Page() {
  const cart = await getCart();
  return (
    <div className="main-cart section-spacing">
      <div className="page-width">
        <h1 className="main-cart__title h2">{t('cart.heading')}</h1>
        <CartPage cart={cart} strings={strings(CART_STRINGS)} />
      </div>
    </div>
  );
}
