'use client';
// Cart drawer: theme/sections/cart-drawer.liquid — a <dialog id="CartDrawer"> (@ui/dialog opens it from
// [data-dialog-open="CartDrawer"]) with the title and count, the free-shipping progress
// (snippets/cart-free-shipping) and CartContents. The cart loads when the drawer first opens and
// follows cart:changed (detail.cart) from the buy buttons and the cart page.
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.js';
import CartContents, { FreeShipping } from './CartContents.js';
import { getCart } from '@/app/actions.js';

export default function CartDrawer({ strings, colorScheme, freeShippingThreshold, upsell, loginUrl, recommendations, details }) {
  const dialog = useRef(null);
  // undefined: not loaded yet (nothing shown); null: no cart (the empty state)
  const [cart, setCart] = useState(undefined);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    const onOpen = () => {
      if (loaded) return;
      setLoaded(true);
      getCart().then(setCart);
    };
    const onChanged = (event) => {
      if (!event.detail?.cart) return;
      setLoaded(true);
      setCart(event.detail.cart);
    };
    element.addEventListener('dialog:open', onOpen);
    addEventListener('cart:changed', onChanged);
    return () => {
      element.removeEventListener('dialog:open', onOpen);
      removeEventListener('cart:changed', onChanged);
    };
  }, [loaded]);

  const count = cart?.totalQuantity ?? 0;
  return (
    <dialog ref={dialog} id="CartDrawer" className={`drawer cart-drawer color-${colorScheme}`} aria-labelledby="CartDrawer-title">
      <div className="drawer__inner">
        <div className="drawer__header cart-drawer__header">
          <h2 id="CartDrawer-title" className="h5">
            {strings['cart.title']}
            {count > 0 && <span className="muted"> ({count})</span>}
          </h2>
          <button type="button" className="btn btn--icon" data-dialog-close aria-label={strings['accessibility.close']}>
            <Icon name="close" />
          </button>
          <FreeShipping cart={cart} threshold={freeShippingThreshold} strings={strings} />
        </div>
        {cart !== undefined && (
          <CartContents cart={cart} strings={strings} onChange={setCart} upsell={upsell} loginUrl={loginUrl} details={details} />
        )}
      </div>
      {/* Outside the re-rendered contents, so it stays put while the cart updates */}
      {recommendations}
    </dialog>
  );
}
