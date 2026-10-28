// Newsletter subscribers in Shopify: one place for POST /newsletter and POST /spin.
// subscribe(email) → { customer, status: 'subscribed' | 'already_subscribed' }: a new email becomes a
// customer subscribed to email marketing and tagged "newsletter"; an existing customer gets the
// consent and the tag.
import { admin } from './shopify.js';

const TAG = 'newsletter';
const consent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };

export const EMAIL = /^[^\s@"'\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;

// Exact lookup by email; the customers(query:) search uses an index that lags behind by a few
// seconds, so a repeated sign-up would try to create the customer twice
export async function findCustomer(email) {
  const data = await admin(
    `query ($email: String!) {
      customerByIdentifier(identifier: { emailAddress: $email }) {
        id
        tags
        emailMarketingConsent { marketingState }
        spin: metafield(namespace: "custom", key: "spin_prize") { value }
      }
    }`,
    { email }
  );
  return data.customerByIdentifier ?? null;
}

export async function subscribe(email) {
  const customer = await findCustomer(email);
  if (customer?.emailMarketingConsent?.marketingState === 'SUBSCRIBED') {
    return { customer, status: 'already_subscribed' };
  }
  if (customer) {
    await admin(
      `mutation ($input: CustomerEmailMarketingConsentUpdateInput!) {
        customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } }
      }`,
      { input: { customerId: customer.id, emailMarketingConsent: consent } },
      'customerEmailMarketingConsentUpdate'
    );
    await addTags(customer.id, [TAG]);
    return { customer, status: 'subscribed' };
  }
  const data = await admin(
    `mutation ($input: CustomerInput!) {
      customerCreate(input: $input) { customer { id tags } userErrors { message } }
    }`,
    { input: { email, emailMarketingConsent: consent, tags: [TAG] } },
    'customerCreate'
  );
  return { customer: { ...data.customerCreate.customer, spin: null }, status: 'subscribed' };
}

export async function addTags(id, tags) {
  await admin(
    `mutation ($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) { userErrors { message } }
    }`,
    { id, tags },
    'tagsAdd'
  );
}
