// Storefront API client, used on the server only (server components, server actions).
import { currentLocale } from './locale.js';
// SHOPIFY_STORE_DOMAIN=mock.shop uses Shopify's public demo catalog (no token) for development.
// Without a store `configured` is false and every call returns null: pages render their empty states.
const domain = process.env.SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || '2026-10';
const mock = domain === 'mock.shop';
const endpoint = mock ? 'https://mock.shop/api' : `https://${domain}/api/${version}/graphql.json`;

export const configured = Boolean(domain && (token || mock));

// The query's operation asked in the visitor's country / language: $country / $language variables and
// @inContext on the first query or mutation (a shorthand `{ … }` query gets an operation of its own)
function inContext(query, { country, language }) {
  const vars = [country && '$country: CountryCode', language && '$language: LanguageCode'].filter(Boolean).join(', ');
  const args = [country && 'country: $country', language && 'language: $language'].filter(Boolean).join(', ');
  const operation = /\b(query|mutation)\b\s*(\w*)\s*(?:\(([^)]*)\))?\s*\{/;
  if (operation.test(query)) {
    return query.replace(
      operation,
      (_, type, name, own) => `${type} ${name}(${[own, vars].filter(Boolean).join(', ')}) @inContext(${args}) {`
    );
  }
  return query.replace('{', `query (${vars}) @inContext(${args}) {`);
}

// One GraphQL request, in the visitor's country / language (lib/locale.js). Queries are cached by Next
// for `revalidate` seconds (per country and language: they are part of the request); `cache: 'no-store'`
// for anything per visitor (the cart)
export async function storefront(query, variables = {}, { revalidate = 300, cache } = {}) {
  if (!configured) return null;
  const headers = { 'Content-Type': 'application/json' };
  if (token && !mock) headers['X-Shopify-Storefront-Access-Token'] = token;
  const locale = mock ? {} : await currentLocale();
  const contextual = locale.country || locale.language;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: contextual ? inContext(query, locale) : query, variables: { ...variables, ...locale } }),
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

// Shopify's customer accounts (login, orders) live on the store's domain: /account redirects there
export const accountUrl = () => (domain && !mock ? `https://${domain}/account` : null);

export { formatMoney } from './format.js';
