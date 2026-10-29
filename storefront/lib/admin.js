// Admin API reads for what the Storefront API doesn't give: theme files (videos), a collection's own sort
// order and product count, tax settings, Judge.me reviews, a page's template. Server only:
// SHOPIFY_ADMIN_TOKEN (read_files, read_products) never reaches the browser. The data is optional: without
// the token, or when a request fails, every call returns null and the callers fall back.
import { cache } from 'react';
import { API_VERSION, STORE_DOMAIN } from './env.js';

const token = process.env.SHOPIFY_ADMIN_TOKEN;

// The POST, memoized for the request like the Storefront API's (lib/shopify.js); null on any failure
const post = cache(async (body, revalidate) => {
  try {
    const response = await fetch(`https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body,
      next: { revalidate },
    });
    return (await response.json()).data ?? null;
  } catch {
    return null;
  }
});

// One Admin API GraphQL request, cached by Next for `revalidate` seconds
export async function admin(query, variables = {}, { revalidate = 300 } = {}) {
  if (!token || !STORE_DOMAIN) return null;
  return post(JSON.stringify({ query, variables }), revalidate);
}

// Prices include tax (Settings > Taxes and duties): "Tax included." under the product price, as cart.taxes_included
export async function taxesIncluded() {
  return Boolean((await admin('{ shop { taxesIncluded } }', {}, { revalidate: 3600 }))?.shop?.taxesIncluded);
}

// A product's Judge.me reviews: the data its review widget renders from (metafield
// judgeme.review_widget_data, which the Storefront API doesn't expose) — average, count, reviews. null
// without the token or reviews.
export async function judgeMeReviews(productId) {
  const data = await admin(
    'query ($id: ID!) { product(id: $id) { reviews: metafield(namespace: "judgeme", key: "review_widget_data") { value } } }',
    { id: productId },
    { revalidate: 60 }
  );
  try {
    return JSON.parse(data?.product?.reviews?.value ?? 'null');
  } catch {
    return null;
  }
}

// The template a page uses (page.<suffix>.json, set on the page in the admin), as page.template_suffix:
// '' for the default one, null without the token
export async function pageTemplateSuffix(handle) {
  const data = await admin('query ($q: String) { pages(first: 1, query: $q) { nodes { templateSuffix } } }', {
    q: `handle:${handle}`,
  });
  return data ? (data.pages.nodes[0]?.templateSuffix ?? '') : null;
}
