// The cart in the browser for what shows cart state (quick add, "In cart", the drawer's count): loaded
// once per page (getCart server action) when the visitor has a cart, then kept in step with
// cart:changed (detail.cart), which every cart action dispatches.
//   useCart() — React: re-renders on change; null = no cart
//   onCart(fn) — anything else: fn(cart) now (once loaded) and on every change; returns unsubscribe
//   publish(cart) — after an action: tells everyone (cart:changed)
import { useEffect, useState } from 'react';
import { getCart } from '@/app/actions.js';

let current;
let loading;

const hasCart = () => /(?:^|; )cart_count=[1-9]/.test(document.cookie);

function load() {
  loading ??= (hasCart() ? getCart() : Promise.resolve(null)).then((cart) => (current ??= cart ?? null));
  return loading;
}

export function publish(cart) {
  current = cart;
  dispatchEvent(new CustomEvent('cart:changed', { detail: { cart } }));
}

export function onCart(fn) {
  const listener = (event) => event.detail?.cart && fn(event.detail.cart);
  addEventListener('cart:changed', listener);
  if (current !== undefined) fn(current);
  else load().then(fn);
  return () => removeEventListener('cart:changed', listener);
}

export function useCart() {
  const [cart, setCart] = useState(current ?? null);
  useEffect(() => onCart(setCart), []);
  return cart;
}

// Quantity of a variant, or of all a product's variants, in the cart
export function quantityIn(cart, { variantId, productHandle }) {
  return (cart?.lines.nodes ?? [])
    .filter((line) => (variantId ? line.merchandise.id === variantId : line.merchandise.product.handle === productHandle))
    .reduce((sum, line) => sum + line.quantity, 0);
}

// Opens the cart drawer (Theme settings > Cart > "After adding to cart": drawer)
export async function openDrawer() {
  const drawer = document.getElementById('CartDrawer');
  if (drawer) (await import('@ui/dialog')).openDialog(drawer);
}
