// The visitor's cart: its id in an httpOnly cookie, the item count in a readable one (the header's
// count reads it in the browser, so pages stay static). Read here; changed by app/actions.js.
import { cookies } from 'next/headers';
import { storefront } from './shopify.js';
import { CART } from './queries.js';

export const CART_COOKIE = 'cart';
export const COUNT_COOKIE = 'cart_count';

export async function getCart() {
  const id = (await cookies()).get(CART_COOKIE)?.value;
  if (!id) return null;
  const data = await storefront(
    `#graphql
    query Cart($id: ID!) { cart(id: $id) { ...Cart } }
    ${CART}`,
    { id },
    { cache: 'no-store' }
  );
  return data?.cart ?? null;
}

// A cart mutation (cartCreate / cartLinesAdd / …) that returns { cart, userErrors }
export async function cartMutation(name, signature, args, variables) {
  const data = await storefront(
    `#graphql
    mutation ${signature} {
      result: ${name}(${args}) { cart { ...Cart } userErrors { message } }
    }
    ${CART}`,
    variables,
    { cache: 'no-store' }
  );
  const { cart, userErrors } = data.result;
  if (userErrors.length) throw new Error(userErrors.map((error) => error.message).join('; '));
  return cart;
}
