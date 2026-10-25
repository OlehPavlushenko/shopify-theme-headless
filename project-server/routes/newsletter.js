// POST /newsletter { email, token? } — subscribes the email to marketing in Shopify.
// New email: creates a customer, subscribed, tagged "newsletter". Existing customer: sets the
// consent and adds the tag. Answers { ok, status } or { ok: false, error } with a stable code the
// theme maps to its own texts: subscribed | already_subscribed | invalid_email | captcha_failed | server_error.
import { Router } from 'express';
import { admin } from '../lib/shopify.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

const TAG = 'newsletter';
const EMAIL = /^[^\s@"'\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;
const consent = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' };

const router = Router();

router.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }
  if (!(await verifyRecaptcha(req.body?.token, 'newsletter'))) {
    return res.status(403).json({ ok: false, error: 'captcha_failed' });
  }

  try {
    const customer = await findCustomer(email);
    if (customer?.emailMarketingConsent?.marketingState === 'SUBSCRIBED') {
      return res.json({ ok: true, status: 'already_subscribed' });
    }
    if (customer) await subscribe(customer.id);
    else await createSubscriber(email);
    return res.json({ ok: true, status: 'subscribed' });
  } catch (error) {
    console.error('Newsletter sign-up failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

async function findCustomer(email) {
  // The email is validated above (no quotes or spaces), so it is safe inside the search query
  const data = await admin(
    `query ($query: String!) {
      customers(first: 1, query: $query) {
        nodes { id emailMarketingConsent { marketingState } }
      }
    }`,
    { query: `email:"${email}"` }
  );
  return data.customers.nodes[0] ?? null;
}

async function createSubscriber(email) {
  await admin(
    `mutation ($input: CustomerInput!) {
      customerCreate(input: $input) { userErrors { message } }
    }`,
    { input: { email, emailMarketingConsent: consent, tags: [TAG] } },
    'customerCreate'
  );
}

async function subscribe(customerId) {
  await admin(
    `mutation ($input: CustomerEmailMarketingConsentUpdateInput!) {
      customerEmailMarketingConsentUpdate(input: $input) { userErrors { message } }
    }`,
    { input: { customerId, emailMarketingConsent: consent } },
    'customerEmailMarketingConsentUpdate'
  );
  await admin(
    `mutation ($id: ID!, $tags: [String!]!) {
      tagsAdd(id: $id, tags: $tags) { userErrors { message } }
    }`,
    { id: customerId, tags: [TAG] },
    'tagsAdd'
  );
}

export default router;
