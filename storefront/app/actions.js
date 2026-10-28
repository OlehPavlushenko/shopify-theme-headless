'use server';
// Cart changes from forms (they work without JS too). Each one keeps the cart cookies in step;
// setting cookies in a server action re-renders the current page with the new cart.
import { cookies } from 'next/headers';
import { CART_COOKIE, COUNT_COOKIE, cartMutation } from '@/lib/cart.js';

const YEAR = 60 * 60 * 24 * 365;

async function remember(cart) {
  const jar = await cookies();
  jar.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: YEAR });
  jar.set(COUNT_COOKIE, String(cart.totalQuantity), { sameSite: 'lax', secure: true, path: '/', maxAge: YEAR });
}

// formData: merchandiseId, quantity
export async function addToCart(formData) {
  const line = { merchandiseId: formData.get('merchandiseId'), quantity: Math.max(1, Number(formData.get('quantity')) || 1) };
  const id = (await cookies()).get(CART_COOKIE)?.value;
  let cart = null;
  if (id) {
    // A cart that expired or was checked out: start a new one
    cart = await cartMutation('cartLinesAdd', 'CartAdd($id: ID!, $lines: [CartLineInput!]!)', 'cartId: $id, lines: $lines', {
      id,
      lines: [line],
    }).catch(() => null);
  }
  cart ??= await cartMutation('cartCreate', 'CartCreate($lines: [CartLineInput!]!)', 'input: { lines: $lines }', { lines: [line] });
  await remember(cart);
}

// formData: lineId, quantity (0 removes the line)
export async function updateLine(formData) {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return;
  const quantity = Math.max(0, Number(formData.get('quantity')) || 0);
  const cart = await cartMutation(
    'cartLinesUpdate',
    'CartUpdate($id: ID!, $lines: [CartLineUpdateInput!]!)',
    'cartId: $id, lines: $lines',
    {
      id,
      lines: [{ id: formData.get('lineId'), quantity }],
    }
  );
  await remember(cart);
}
