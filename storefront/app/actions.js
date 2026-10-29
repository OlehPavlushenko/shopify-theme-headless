'use server';
// Cart reads and changes for the cart drawer, the cart page and the buy buttons, the currency / language
// switchers and the review form. Each cart change keeps the cart cookies in step and returns the cart, so
// the client renders it without another request.
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CART_COOKIE, COUNT_COOKIE, cartMutation, getCart as readCart } from '@/lib/cart.js';
import { STORE_DOMAIN } from '@/lib/env.js';
import { COUNTRY_COOKIE, LANGUAGE_COOKIE, currentLocale, isCountry, isLanguage } from '@/lib/locale.js';

// Cookies kept for a year, for the whole site
const KEEP = { sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 365 };

const cartId = async () => (await cookies()).get(CART_COOKIE)?.value;

// The cart's cookies after a change: its id (httpOnly) and the item count (read in the browser)
async function remember(cart) {
  const jar = await cookies();
  jar.set(CART_COOKIE, cart.id, { ...KEEP, httpOnly: true, secure: true });
  jar.set(COUNT_COOKIE, String(cart.totalQuantity), { ...KEEP, secure: true });
  return cart;
}

// A new cart in the visitor's country (Markets: the currency of its prices at checkout)
async function newCart(input) {
  const { country } = await currentLocale();
  return cartMutation('cartCreate', 'CartCreate($input: CartInput!)', 'input: $input', {
    input: { ...input, ...(country && { buyerIdentity: { countryCode: country } }) },
  });
}

// A change to the visitor's cart (a mutation on $id): the changed cart, or null without a cart
async function changeCart(name, signature, args, variables) {
  const id = await cartId();
  if (!id) return null;
  return remember(await cartMutation(name, signature, `cartId: $id, ${args}`, { id, ...variables }));
}

// A buy button's line (formData: merchandiseId, quantity)
const lineOf = (formData) => ({
  merchandiseId: formData.get('merchandiseId'),
  quantity: Math.max(1, Number(formData.get('quantity')) || 1),
});

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
        shop_domain: STORE_DOMAIN,
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
  if (isCountry(country)) {
    jar.set(COUNTRY_COOKIE, country, KEEP);
    const id = jar.get(CART_COOKIE)?.value;
    if (id) {
      await cartMutation(
        'cartBuyerIdentityUpdate',
        'CartBuyer($id: ID!, $buyer: CartBuyerIdentityInput!)',
        'cartId: $id, buyerIdentity: $buyer',
        {
          id,
          buyer: { countryCode: country },
        }
      ).catch(() => null);
    }
  }
  if (isLanguage(language)) jar.set(LANGUAGE_COOKIE, language, KEEP);
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

// The visitor's cart (lib/cart-client.js loads it once per page)
export async function getCart() {
  return readCart();
}

// formData: merchandiseId, quantity
export async function addToCart(formData) {
  const lines = [lineOf(formData)];
  // No cart, or one that expired or was checked out: start a new one
  const added = await changeCart('cartLinesAdd', 'CartAdd($id: ID!, $lines: [CartLineInput!]!)', 'lines: $lines', { lines }).catch(
    () => null
  );
  return added ?? remember(await newCart({ lines }));
}

// "Buy it now": a cart of its own with just this line, straight to checkout (the visitor's cart stays as it
// is). formData: merchandiseId, quantity. Returns the checkout URL.
export async function buyNow(formData) {
  const cart = await newCart({ lines: [lineOf(formData)] });
  return cart.checkoutUrl;
}

// A line's new quantity (0 removes it)
export async function updateLine(lineId, quantity) {
  return changeCart('cartLinesUpdate', 'CartUpdate($id: ID!, $lines: [CartLineUpdateInput!]!)', 'lines: $lines', {
    lines: [{ id: lineId, quantity: Math.max(0, Number(quantity) || 0) }],
  });
}

// The order note (Theme settings > Cart > "Show cart note")
export async function setCartNote(note) {
  return changeCart('cartNoteUpdate', 'CartNote($id: ID!, $note: String!)', 'note: $note', { note: String(note ?? '') });
}

// The order details fields (cart attributes): the whole list, [{ key, value }]
export async function setCartAttributes(attributes) {
  return changeCart('cartAttributesUpdate', 'CartAttributes($id: ID!, $attributes: [AttributeInput!]!)', 'attributes: $attributes', {
    attributes: attributes.map(({ key, value }) => ({ key: String(key), value: String(value ?? '') })),
  });
}

// The cart's discount codes (the whole list: add or remove one by passing the new list); without a cart
// yet (a promo code before the first add), a new, empty cart holding the code
export async function setDiscountCodes(codes) {
  const changed = await changeCart('cartDiscountCodesUpdate', 'CartDiscounts($id: ID!, $codes: [String!]!)', 'discountCodes: $codes', {
    codes,
  });
  return changed ?? remember(await newCart({ discountCodes: codes }));
}
