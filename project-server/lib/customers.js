// Customers as the store's inbox: a message (contact form, back-in-stock request) goes on top of
// the customer's note, and the customer gets a tag to filter by in the admin. The customer is found
// by email or created (without marketing consent).
import { admin } from './shopify.js';

// Shopify keeps up to 5000 characters in a note: older entries are cut from the end
const MAX_NOTE = 5000;

export async function addNote(email, entry, tag, name = '') {
  const customer = await findCustomer(email);
  if (customer) {
    const note = [entry, customer.note].filter(Boolean).join('\n\n').slice(0, MAX_NOTE);
    await admin(
      `mutation ($input: CustomerInput!) {
        customerUpdate(input: $input) { userErrors { message } }
      }`,
      { input: { id: customer.id, note } },
      'customerUpdate'
    );
    await admin(
      `mutation ($id: ID!, $tags: [String!]!) {
        tagsAdd(id: $id, tags: $tags) { userErrors { message } }
      }`,
      { id: customer.id, tags: [tag] },
      'tagsAdd'
    );
    return;
  }
  const [firstName, ...rest] = name.split(/\s+/);
  await admin(
    `mutation ($input: CustomerInput!) {
      customerCreate(input: $input) { userErrors { message } }
    }`,
    {
      input: {
        email,
        firstName: firstName || undefined,
        lastName: rest.join(' ') || undefined,
        note: entry.slice(0, MAX_NOTE),
        tags: [tag],
      },
    },
    'customerCreate'
  );
}

// Exact lookup by email (the customers(query:) search index lags behind by a few seconds)
async function findCustomer(email) {
  const data = await admin(
    `query ($email: String!) {
      customerByIdentifier(identifier: { emailAddress: $email }) { id note }
    }`,
    { email }
  );
  return data.customerByIdentifier ?? null;
}

// UTC date and time for the note, e.g. "2026-10-28 14:05 UTC"
export const stamp = () => `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
