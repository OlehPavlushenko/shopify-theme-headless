// Storefront API client, used on the server only (server components, route handlers).
// Without SHOPIFY_STORE_DOMAIN / SHOPIFY_STOREFRONT_TOKEN `configured` is false and every call returns
// null: pages render their empty states instead of failing.
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || '2026-10';

export const configured = Boolean(domain && token);

// One GraphQL request; Next caches the answer for `revalidate` seconds
export async function storefront(query, variables = {}, { revalidate = 300 } = {}) {
  if (!configured) return null;
  const response = await fetch(`https://${domain}/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  const { data, errors } = await response.json();
  if (errors?.length) throw new Error(`Storefront API: ${errors.map((error) => error.message).join('; ')}`);
  return data;
}

// Menu and shop URLs come as absolute store URLs: the path only, so links stay on this site
export function localPath(url) {
  try {
    const { pathname, search } = new URL(url);
    return pathname + search;
  } catch {
    return url;
  }
}

// "$12.50" in the price's own currency
export function formatMoney({ amount, currencyCode }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount));
}
