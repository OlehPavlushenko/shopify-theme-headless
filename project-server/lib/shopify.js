// Shopify Admin GraphQL client (custom app token with read/write customers).
import { createAdminApiClient } from '@shopify/admin-api-client';

const client = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE_NAME, // xxx.myshopify.com
  apiVersion: process.env.SHOPIFY_API_VERSION || '2025-07',
  accessToken: process.env.SHOPIFY_ADMIN_API_PASSWORD,
});

// Runs a query; throws on GraphQL errors and on the mutation's userErrors
export async function admin(query, variables, field) {
  const { data, errors } = await client.request(query, { variables });
  if (errors) throw new Error(errors.message ?? JSON.stringify(errors));
  const userErrors = field ? data?.[field]?.userErrors : null;
  if (userErrors?.length) throw new Error(userErrors.map((e) => e.message).join('; '));
  return data;
}
