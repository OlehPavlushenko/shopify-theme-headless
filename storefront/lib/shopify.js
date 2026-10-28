// Storefront API client, used on the server only (server components, server actions).
// SHOPIFY_STORE_DOMAIN=mock.shop uses Shopify's public demo catalog (no token) for development.
// Without a store `configured` is false and every call returns null: pages render their empty states.
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || '2026-10';
const mock = domain === 'mock.shop';
const endpoint = mock ? 'https://mock.shop/api' : `https://${domain}/api/${version}/graphql.json`;

export const configured = Boolean(domain && (token || mock));

// One GraphQL request. Queries are cached by Next for `revalidate` seconds; `cache: 'no-store'` for
// anything per visitor (the cart)
export async function storefront(query, variables = {}, { revalidate = 300, cache } = {}) {
  if (!configured) return null;
  const headers = { 'Content-Type': 'application/json' };
  if (token && !mock) headers['X-Shopify-Storefront-Access-Token'] = token;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    ...(cache ? { cache } : { next: { revalidate } }),
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
