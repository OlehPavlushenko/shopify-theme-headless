// POST /spin { email, prizes, signature, token? } — "Spin to win": signs the email up (as /newsletter)
// and picks the prize here, once per email.
// - prizes: the wheel's prize list as the theme printed it — a JSON string of [{ label, code, weight }];
//   signature: its HMAC-SHA256 with THEME_SECRET (Liquid: prizes | hmac_sha256: settings.api_secret),
//   so the chances can't be changed in the browser. Without THEME_SECRET the list isn't checked
//   (local development only).
// - The first spin of an email: a prize by weight, kept on the customer (metafield custom.spin_prize,
//   tag "spin-wheel"). Any later spin of that email — another browser, cleared storage — gets the
//   same prize back with status "already_spun".
// Answers { ok: true, status: 'spun' | 'already_spun', subscribed: 'subscribed' | 'already_subscribed',
// prize: { label, code } } or { ok: false, error: invalid_email | invalid_prizes | captcha_failed | server_error }.
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Router } from 'express';
import { admin } from '../lib/shopify.js';
import { captchaFailure } from '../lib/recaptcha.js';
import { EMAIL, subscribe, addTags } from '../lib/subscribers.js';

const TAG = 'spin-wheel';
const MAX_PRIZES = 12;

const router = Router();

// The theme's list, checked against its signature, as [{ label, code, weight }] (null when not valid)
function readPrizes(raw, signature) {
  if (typeof raw !== 'string' || raw.length > 4000) return null;
  const secret = process.env.THEME_SECRET;
  if (secret) {
    const expected = createHmac('sha256', secret).update(raw).digest('hex');
    const given = String(signature ?? '');
    if (given.length !== expected.length || !timingSafeEqual(Buffer.from(given), Buffer.from(expected))) return null;
  }
  try {
    const prizes = JSON.parse(raw);
    if (!Array.isArray(prizes) || prizes.length < 2 || prizes.length > MAX_PRIZES) return null;
    const valid = prizes.every(
      (p) => typeof p.label === 'string' && typeof p.code === 'string' && Number.isFinite(p.weight) && p.weight > 0
    );
    return valid ? prizes : null;
  } catch {
    return null;
  }
}

// A prize by weight
function pick(prizes) {
  const total = prizes.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  return prizes.find((p) => (roll -= p.weight) < 0) ?? prizes[0];
}

router.post('/', async (req, res) => {
  const email = String(req.body?.email ?? '')
    .trim()
    .toLowerCase();
  if (email.length > 254 || !EMAIL.test(email)) return res.status(400).json({ ok: false, error: 'invalid_email' });
  const prizes = readPrizes(req.body?.prizes, req.body?.signature);
  if (!prizes) return res.status(400).json({ ok: false, error: 'invalid_prizes' });
  const captcha = await captchaFailure(req.body?.token, 'spin');
  if (captcha) return res.status(403).json({ ok: false, error: 'captcha_failed', reason: captcha });

  try {
    const { customer, status: subscribed } = await subscribe(email);
    if (customer.spin?.value) {
      const { label, code } = JSON.parse(customer.spin.value);
      return res.json({ ok: true, status: 'already_spun', subscribed, prize: { label, code } });
    }
    const { label, code } = pick(prizes);
    await admin(
      `mutation ($m: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $m) { userErrors { message } } }`,
      {
        m: [
          {
            ownerId: customer.id,
            namespace: 'custom',
            key: 'spin_prize',
            type: 'json',
            value: JSON.stringify({ label, code, at: new Date().toISOString() }),
          },
        ],
      },
      'metafieldsSet'
    );
    await addTags(customer.id, [TAG]);
    return res.json({ ok: true, status: 'spun', subscribed, prize: { label, code } });
  } catch (error) {
    console.error('Spin failed:', error.message);
    return res.status(502).json({ ok: false, error: 'server_error' });
  }
});

export default router;
