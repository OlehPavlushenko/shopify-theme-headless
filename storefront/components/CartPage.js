'use client';
// The cart page's contents (theme/sections/main-cart.liquid): CartContents in the page layout, keeping
// the cart it is given (server-rendered) and every cart the actions return
import { useEffect, useState } from 'react';
import CartContents from './CartContents.js';

export default function CartPage({ cart: initial, strings, upsell, loginUrl }) {
  const [cart, setCart] = useState(initial);
  useEffect(() => {
    const onChanged = (event) => event.detail?.cart && setCart(event.detail.cart);
    addEventListener('cart:changed', onChanged);
    return () => removeEventListener('cart:changed', onChanged);
  }, []);
  return <CartContents cart={cart} strings={strings} layout="page" onChange={setCart} upsell={upsell} loginUrl={loginUrl} />;
}
