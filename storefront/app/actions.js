'use server';
// Cart reads and changes for the cart drawer, the cart page and the buy buttons. Each change keeps the
// cart cookies in step and returns the cart, so the client renders it without another request.
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CART_COOKIE, COUNT_COOKIE, cartMutation, getCart as readCart } from '@/lib/cart.js';
import { COUNTRY_COOKIE, LANGUAGE_COOKIE, currentLocale } from '@/lib/locale.js';

const YEAR = 60 * 60 * 24 * 365;

// A new cart in the visitor's country (Markets: the currency of its prices at checkout)
async function newCart(input) {
  const { country } = await currentLocale();
  return cartMutation('cartCreate', 'CartCreate($input: CartInput!)', 'input: $input', {
    input: { ...input, ...(country && { buyerIdentity: { countryCode: country } }) },
  });
}

// "Write a review" (the reviews block, components/ProductReviews.js): the review to Judge.me's public API,
// as its widget's form sends it. formData: productId (numeric), name, email, rating, title, body.
// Returns { ok } for the form (useActionState).
export async function submitReview(_state, formData) {
  const field = (name) => String(formData.get(name) ?? '').trim();
  const rating = Number(field('rating'));
  if (!field('name') || !/^\S+@\S+\.\S+$/.test(field('email')) || !(rating >= 1 && rating <= 5) || !field('body')) return { ok: false };
  try {
    const response = await fetch('https://judge.me/api/v1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_domain: process.env.SHOPIFY_STORE_DOMAIN,
        platform: 'shopify',
        id: Number(field('productId')),
        name: field('name'),
        email: field('email'),
        rating,
        title: field('title'),
        body: field('body'),
      }),
    });
    return { ok: response.ok };
  } catch {
    return { ok: false };
  }
}

// The currency / language switchers (snippets/localization-form, a form with country_code or
// language_code): the choice in cookies, the cart moved to the country, back to the page it was made on
export async function setLocalization(formData) {
  const jar = await cookies();
  const country = String(formData.get('country_code') ?? '').toUpperCase();
  const language = String(formData.get('language_code') ?? '').toUpperCase();
  if (/^[A-Z]{2}$/.test(country)) {
    jar.set(COUNTRY_COOKIE, country, { sameSite: 'lax', path: '/', maxAge: YEAR });
    const id = jar.get(CART_COOKIE)?.value;
    if (id) {
      await cartMutation(
        'cartBuyerIdentityUpdate',
        'CartBuyer($id: ID!, $buyer: CartBuyerIdentityInput!)',
        'cartId: $id, buyerIdentity: $buyer',
        { id, buyer: { countryCode: country } }
      ).catch(() => null);
    }
  }
  if (/^[A-Z]{2}(_[A-Z]{2})?$/.test(language)) jar.set(LANGUAGE_COOKIE, language, { sameSite: 'lax', path: '/', maxAge: YEAR });
  const from = (await headers()).get('referer');
  let back = '/';
  try {
    const url = new URL(from);
    back = url.pathname + url.search;
  } catch {
    // No referrer: the home page
  }
  redirect(back);
}

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
  cart ??= await newCart({ lines: [line] });
  return remember(cart);
}

// "Buy it now": a cart of its own with just this line, straight to checkout (the visitor's cart stays as it
// is). formData: merchandiseId, quantity. Returns the checkout URL.
export async function buyNow(formData) {
  const line = { merchandiseId: formData.get('merchandiseId'), quantity: Math.max(1, Number(formData.get('quantity')) || 1) };
  const cart = await newCart({ lines: [line] });
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
    : await newCart({ discountCodes: codes });
  return remember(cart);
}
