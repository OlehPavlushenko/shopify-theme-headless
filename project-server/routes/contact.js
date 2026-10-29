// POST /contact { name?, email, phone?, subject?, message, token? } — a contact form message (subject:
// the product of "Ask a question"), kept in Shopify: on top of the sender's customer note with the
// date, phone and name, tag "contact" (lib/customers).
// In the admin: Customers filtered by that tag (Shopify Flow can email the team on "Customer tags added").
// Answers { ok: true } or { ok: false, error } with a stable code the theme maps to its own texts:
// invalid_email | invalid_message | invalid_phone | captcha_failed | server_error.
import { Router } from 'express';
import { addNote, stamp } from '../lib/customers.js';
import { captchaFailure } from '../lib/recaptcha.js';

const EMAIL = /^[^\s@"'\\]+@[^\s@"'\\]+\.[^\s@"'\\]+$/;
const PHONE = /^\+?[0-9\s().-]{7,20}$/;
const MAX_MESSAGE = 5000;

const router = Router();

router.post('/', async (req, res) => {
  const text = (key, max) =>
    String(req.body?.[key] ?? '')
      .trim()
      .slice(0, max);
  const email = text('email', 255).toLowerCase();
  const name = text('name', 100);
  const phone = text('phone', 30);
  const subject = text('subject', 200);
  const message = text('message', MAX_MESSAGE + 1);
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  if (phone && !PHONE.test(phone)) return res.status(400).json({ ok: false, error: 'invalid_phone' });
  if (!message || message.length > MAX_MESSAGE) return res.status(400).json({ ok: false, error: 'invalid_message' });
  const captcha = await captchaFailure(req.body?.token, 'contact');
  if (captcha) return res.status(403).json({ ok: false, error: 'captcha_failed', reason: captcha });

  const entry = `— ${subject ? `Question about ${subject}` : 'Contact form'}, ${stamp()}${phone ? `, phone ${phone}` : ''}${name ? `, ${name}` : ''}\n${message}`;
  try {
    await addNote(email, entry, 'contact', name);
    return res.json({ ok: true });
  } catch (error) {
    console.error('Contact message failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

export default router;
