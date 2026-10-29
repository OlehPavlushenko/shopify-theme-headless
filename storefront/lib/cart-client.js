// The cart in the browser for components that show cart state (quick add, "In cart"): loaded once
// per page (getCart server action), then kept in step with cart:changed (detail.cart) from every
// cart action. useCart() re-renders on change; null = no cart.
import { useEffect, useState } from 'react';
import { getCart } from '@/app/actions.js';

let current;
let loading;

function load() {
  loading ??= getCart().then((cart) => (current ??= cart ?? null));
  return loading;
}

if (typeof window !== 'undefined') {
  addEventListener('cart:changed', (event) => {
    if (event.detail?.cart) current = event.detail.cart;
  });
}

export function useCart() {
  const [cart, setCart] = useState(current);
  useEffect(() => {
    // Only when the cart cookie is there: no request for visitors without a cart
    if (current === undefined && /(?:^|; )cart_count=[1-9]/.test(document.cookie)) load().then(setCart);
    const onChanged = (event) => event.detail?.cart && setCart(event.detail.cart);
    addEventListener('cart:changed', onChanged);
    return () => removeEventListener('cart:changed', onChanged);
  }, []);
  return cart ?? null;
}

// Quantity of a variant, or of all a product's variants, in the cart
export function quantityIn(cart, { variantId, productHandle }) {
  return (cart?.lines.nodes ?? [])
    .filter((line) => (variantId ? line.merchandise.id === variantId : line.merchandise.product.handle === productHandle))
    .reduce((sum, line) => sum + line.quantity, 0);
}
