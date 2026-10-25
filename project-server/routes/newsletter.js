import express from 'express';
import fetch from 'node-fetch';
import validator from 'validator';
import {
  getCustomerByEmail,
  createCustomer,
  updateEmailMarketingConsent,
  updateTags
} from '../services/customer.js';

const router = express.Router();

const checkOrigin = (req, res, next) => {
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';

  // Разрешаем внутренние запросы (без origin/referer)
  if (!origin && !referer) {
    return next();
  }

  const allowedHosts = [
    'bioharmony.com.ua',
    '4ba1cfb79ac8.ngrok-free.app'
  ];

  const allowed = allowedHosts.some((host) => origin.includes(host) || referer.includes(host));

  if (!allowed) {
    return res.status(403).json({ error: 'Access denied from invalid origin' });
  }

  next();
};

// ✅ Проверка ReCaptcha v3
const verifyCaptcha = async (token) => {
  if (!token) return false;

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET}&response=${token}`,
    });

    const data = await res.json();
    return data.success && data.score >= 0.4 && data.action === 'newsletter';
  } catch (err) {
    console.error('🛑 ReCaptcha verification error:', err);
    return false;
  }
};

router.post('/', checkOrigin, async (req, res) => {
  const { token, email } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }

  if (!token) {
    console.warn('No ReCaptcha token provided');
    return false;
  }

  if (!token || !(await verifyCaptcha(token))) {
    return res.status(403).json({ error: 'ReCaptcha verification failed' });
  }

  try {
    const customer = await getCustomerByEmail(email);

    if (customer) {
      await Promise.all([
        updateEmailMarketingConsent(customer.id),
        updateTags(customer.id, ['newsletter'])
      ]);
      return res.json({ success: true, message: 'Existing customer updated' });
    } else {
      await createCustomer(email, ['newsletter']);
      return res.json({ success: true, message: 'New customer created' });
    }
  } catch (err) {
    console.error('❌ Ошибка подписки:', err);
    return res.status(500).json({ error: 'Server error', message: err.message });
  }
});

export default router;
