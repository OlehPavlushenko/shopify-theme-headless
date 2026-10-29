// The visitor's cart: its id in an httpOnly cookie, the item count in a readable one (the header's
// count reads it in the browser, so pages stay static). Read here; changed by app/actions.js.
import { cookies } from 'next/headers';
import { storefront } from './shopify.js';
import { IMAGE, MONEY, OPTION } from './queries.js';

export const CART_COOKIE = 'cart';
export const COUNT_COOKIE = 'cart_count';

// The cart's fields (components/CartContents.js; per visitor: never cached)
const CART = `#graphql
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    attributes { key value }
    cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
    discountCodes { code applicable }
    discountAllocations {
      discountedAmount { ${MONEY} }
      ... on CartCodeDiscountAllocation { code }
      ... on CartAutomaticDiscountAllocation { title }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ${MONEY} } amountPerQuantity { ${MONEY} } compareAtAmountPerQuantity { ${MONEY} } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            image { ${IMAGE} }
            product { handle title options { ${OPTION} } }
          }
        }
      }
    }
  }
`;

// The visitor's cart, or null without one
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

// A cart mutation (cartCreate / cartLinesAdd / …) that returns the cart; throws on the API's userErrors
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
  if (!data) throw new Error('Storefront API: no store configured');
  const { cart, userErrors } = data.result;
  if (userErrors.length) throw new Error(userErrors.map((error) => error.message).join('; '));
  return cart;
}
