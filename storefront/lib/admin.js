// Admin API reads for what the Storefront API doesn't give: theme files (videos), a collection's own sort
// order and product count. Server only: SHOPIFY_ADMIN_TOKEN (read_files, read_products) never reaches
// the browser. Without the token every call returns null and the callers fall back.
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const version = process.env.SHOPIFY_API_VERSION || '2026-10';

// Prices include tax (Settings > Taxes and duties): "Tax included." under the product price, as cart.taxes_included
export async function taxesIncluded() {
  return Boolean((await admin('{ shop { taxesIncluded } }', {}, { revalidate: 3600 }))?.shop?.taxesIncluded);
}

export async function admin(query, variables = {}, { revalidate = 300 } = {}) {
  if (!token || !process.env.SHOPIFY_STORE_DOMAIN) return null;
  const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${version}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    next: { revalidate },
  });
  return (await response.json()).data ?? null;
}
