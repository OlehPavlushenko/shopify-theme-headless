'use server';
// Cart reads and changes for the cart drawer, the cart page and the buy buttons. Each change keeps the
// cart cookies in step and returns the cart, so the client renders it without another request.
import { cookies } from 'next/headers';
import { CART_COOKIE, COUNT_COOKIE, cartMutation, getCart as readCart } from '@/lib/cart.js';

const YEAR = 60 * 60 * 24 * 365;

async function remember(cart) {
  const jar = await cookies();
  jar.set(CART_COOKIE, cart.id, { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: YEAR });
  jar.set(COUNT_COOKIE, String(cart.totalQuantity), { sameSite: 'lax', secure: true, path: '/', maxAge: YEAR });
  return cart;
}

const cartId = async () => (await cookies()).get(CART_COOKIE)?.value;

export async function getCart() {
  return readCart();
}

// formData: merchandiseId, quantity
export async function addToCart(formData) {
  const line = { merchandiseId: formData.get('merchandiseId'), quantity: Math.max(1, Number(formData.get('quantity')) || 1) };
  const id = await cartId();
  let cart = null;
  if (id) {
    // A cart that expired or was checked out: start a new one
    cart = await cartMutation('cartLinesAdd', 'CartAdd($id: ID!, $lines: [CartLineInput!]!)', 'cartId: $id, lines: $lines', {
      id,
      lines: [line],
    }).catch(() => null);
  }
  cart ??= await cartMutation('cartCreate', 'CartCreate($lines: [CartLineInput!]!)', 'input: { lines: $lines }', { lines: [line] });
  return remember(cart);
}

// "Buy it now": a cart of its own with just this line, straight to checkout (the visitor's cart stays as it
// is). formData: merchandiseId, quantity. Returns the checkout URL.
export async function buyNow(formData) {
  const line = { merchandiseId: formData.get('merchandiseId'), quantity: Math.max(1, Number(formData.get('quantity')) || 1) };
  const cart = await cartMutation('cartCreate', 'CartCreate($lines: [CartLineInput!]!)', 'input: { lines: $lines }', { lines: [line] });
  return cart.checkoutUrl;
}

// A line's new quantity (0 removes it)
export async function updateLine(lineId, quantity) {
  const id = await cartId();
  if (!id) return null;
  const cart = await cartMutation(
    'cartLinesUpdate',
    'CartUpdate($id: ID!, $lines: [CartLineUpdateInput!]!)',
    'cartId: $id, lines: $lines',
    {
      id,
      lines: [{ id: lineId, quantity: Math.max(0, Number(quantity) || 0) }],
    }
  );
  return remember(cart);
}

// The order note (Theme settings > Cart > "Show cart note")
export async function setCartNote(note) {
  const id = await cartId();
  if (!id) return null;
  const cart = await cartMutation('cartNoteUpdate', 'CartNote($id: ID!, $note: String!)', 'cartId: $id, note: $note', {
    id,
    note: String(note ?? ''),
  });
  return remember(cart);
}

// The order details fields (cart attributes): the whole list, [{ key, value }]
export async function setCartAttributes(attributes) {
  const id = await cartId();
  if (!id) return null;
  const cart = await cartMutation(
    'cartAttributesUpdate',
    'CartAttributes($id: ID!, $attributes: [AttributeInput!]!)',
    'cartId: $id, attributes: $attributes',
    { id, attributes: attributes.map(({ key, value }) => ({ key: String(key), value: String(value ?? '') })) }
  );
  return remember(cart);
}

// The cart's discount codes (the whole list: add or remove one by passing the new list)
export async function setDiscountCodes(codes) {
  const id = await cartId();
  // No cart yet (a promo code before the first add): a new, empty cart holding the code
  const cart = id
    ? await cartMutation('cartDiscountCodesUpdate', 'CartDiscounts($id: ID!, $codes: [String!]!)', 'cartId: $id, discountCodes: $codes', {
        id,
        codes,
      })
    : await cartMutation('cartCreate', 'CartCreate($codes: [String!])', 'input: { discountCodes: $codes }', { codes });
  return remember(cart);
}
