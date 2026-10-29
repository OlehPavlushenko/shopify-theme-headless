// POST /newsletter { email, token? } — subscribes the email to marketing in Shopify (lib/subscribers):
// a new email becomes a subscribed customer tagged "newsletter"; an existing customer gets the
// consent and the tag. Answers { ok, status } or { ok: false, error } with a stable code the theme
// maps to its own texts: subscribed | already_subscribed | invalid_email | captcha_failed | server_error.
import { Router } from 'express';
import { captchaFailure } from '../lib/recaptcha.js';
import { EMAIL, subscribe } from '../lib/subscribers.js';

const router = Router();

router.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) {
    return res.status(400).json({ ok: false, error: 'invalid_email' });
  }
  const captcha = await captchaFailure(req.body?.token, 'newsletter');
  if (captcha) return res.status(403).json({ ok: false, error: 'captcha_failed', reason: captcha });

  try {
    const { status } = await subscribe(email);
    return res.json({ ok: true, status });
  } catch (error) {
    console.error('Newsletter sign-up failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

export default router;
