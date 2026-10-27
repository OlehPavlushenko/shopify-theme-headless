// POST /contact { name?, email, phone?, message, token? } — a contact form message, kept in Shopify.
// The sender is found by email (or created, without marketing consent); the message goes on top of
// the customer's note with the date and the phone, and the customer gets the tag "contact" — in the
// admin: Customers, filtered by that tag (Shopify Flow can email the team on "Customer tags added").
// Answers { ok: true } or { ok: false, error } with a stable code the theme maps to its own texts:
// invalid_email | invalid_message | invalid_phone | captcha_failed | server_error.
import { Router } from 'express';
import { admin } from '../lib/shopify.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

const TAG = 'contact';
const EMAIL = /^[^\s@"'\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;
const PHONE = /^\+?[0-9\s().-]{7,20}$/;
const MAX_MESSAGE = 5000;
// Shopify keeps up to 5000 characters in a note: older messages are cut from the end
const MAX_NOTE = 5000;

const router = Router();

router.post('/', async (req, res) => {
  const text = (key, max) => String(req.body?.[key] ?? '').trim().slice(0, max);
  const email = text('email', 255).toLowerCase();
  const name = text('name', 100);
  const phone = text('phone', 30);
  const message = text('message', MAX_MESSAGE + 1);
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (phone && !PHONE.test(phone)) return res.status(400).json({ ok: false, error: 'invalid_phone' });
  if (!message || message.length > MAX_MESSAGE) return res.status(400).json({ ok: false, error: 'invalid_message' });
  if (!(await verifyRecaptcha(req.body?.token, 'contact'))) {
    return res.status(403).json({ ok: false, error: 'captcha_failed' });
  }

  const date = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const entry = [`— Contact form, ${date} UTC${phone ? `, phone ${phone}` : ''}${name ? `, ${name}` : ''}`, message].join('\n');
  try {
    const customer = await findCustomer(email);
    if (customer) await addMessage(customer, entry);
    else await createCustomer(email, name, entry);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Contact message failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

async function findCustomer(email) {
  const data = await admin(
    `query ($email: String!) {
      customerByIdentifier(identifier: { emailAddress: $email }) { id note }
    }`,
    { email }
  );
  return data.customerByIdentifier ?? null;
}

async function createCustomer(email, name, note) {
  const [firstName, ...rest] = name.split(/\s+/);
  await admin(
    `mutation ($input: CustomerInput!) {
      customerCreate(input: $input) { userErrors { message } }
    }`,
    { input: { email, firstName: firstName || undefined, lastName: rest.join(' ') || undefined, note, tags: [TAG] } },
    'customerCreate'
  );
}

async function addMessage(customer, entry) {
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
    { id: customer.id, tags: [TAG] },
    'tagsAdd'
  );
}

export default router;
