// POST /notify { email, variant, product, token? } — "tell me when it's back in stock": kept on the
// customer (lib/customers) as a note line with the product and variant, tag "back-in-stock".
// In the admin: Customers filtered by that tag; the email when the product is back is sent from
// there (Shopify Email / Flow / a marketing app) — this only collects the requests.
// Answers { ok: true } or { ok: false, error }: invalid_email | invalid_product | captcha_failed | server_error.
import { Router } from 'express';
import { addNote, stamp } from '../lib/customers.js';
import { verifyRecaptcha } from '../lib/recaptcha.js';

const EMAIL = /^[^\s@"'\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;

const router = Router();

router.post('/', async (req, res) => {
  const text = (key, max) => String(req.body?.[key] ?? '').trim().slice(0, max);
  const email = text('email', 255).toLowerCase();
  const variant = text('variant', 20);
  const product = text('product', 200);
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (!/^\d+$/.test(variant) || !product) return res.status(400).json({ ok: false, error: 'invalid_product' });
  if (!(await verifyRecaptcha(req.body?.token, 'notify'))) {
    return res.status(403).json({ ok: false, error: 'captcha_failed' });
  }

  try {
    await addNote(email, `— Back in stock request, ${stamp()}: ${product} (variant ${variant})`, 'back-in-stock');
    return res.json({ ok: true });
  } catch (error) {
    console.error('Back-in-stock request failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

export default router;
