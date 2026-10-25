import express from 'express';
import fetch from 'node-fetch';

import { createDraftOrder } from '../services/createDraftOrder.js';
import { completeDraftOrder } from '../services/completeDraftOrder.js';
import { generateWayforpayForm } from '../services/wayforpay.js';
import { updateEmailMarketingConsent, updateTags } from '../services/customer.js';

const router = express.Router();

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
    return data.success && data.score >= 0.4 && data.action === 'checkout';
  } catch (error) {
    console.error('ReCaptcha verification failed:', error);
    return false;
  }
};


const checkOrigin = (req, res, next) => {
  const origin = req.get('origin') || '';
  const referer = req.get('referer') || '';

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

router.post('/', checkOrigin, async (req, res) => {
  const { token, ...payload } = req.body;

  try {
    if (!token) {
      console.warn('No ReCaptcha token provided');
      return false;
    }

    if (!token || !(await verifyCaptcha(token))) {
      return res.status(403).json({ error: 'ReCaptcha verification failed' });
    }

    const draft = await createDraftOrder(payload);
    const paymentType = payload.payment_information?.payment_type;
    const [firstName, ...rest] = payload.contract_information.full_name.trim().split(' ');
    const lastName = rest.join(' ') || '-';
    const email = payload.contract_information.email?.trim() || `guest-${draft.name}@example.com`;
    
    let orderName = null;

    if (paymentType === 'CARD') {
      const orderReference = draft.id.replace('gid://shopify/DraftOrder/', '') + '_CARD';
      const orderDate = Math.floor(Date.now() / 1000);
      const amount = parseFloat(draft.totalLineItemsPriceSet?.shopMoney?.amount || '0');
      
      const customer = {
        firstName,
        lastName,
        email: email,
        phone: (payload.contract_information.phone || '').replace(/\D/g, '').replace(/^380?/, '380')
      };

      const products = draft.lineItems?.edges?.map(edge => ({
        name: edge.node.title,
        price: parseFloat(edge.node.originalUnitPrice),
        count: edge.node.quantity
      })) || [];

      const html = generateWayforpayForm({ orderReference, orderDate, amount, products, customer});

      return res.send(html);
    } else {
      const order = await completeDraftOrder(draft.id);
      orderName = order.name;

      if (order?.customer?.id) {
        updateEmailMarketingConsent(order.customer.id)
          .then(() => updateTags(order.customer.id, ['checkout-subscribe']))
          .catch((e) => {
            console.error('❌ Не удалось подписать кастомера после заказа (фон):', e);
          });
      }
    }

    const paymentCode = payload.payment_information?.payment_type;
    if (paymentCode === 'CARD') orderName += '_CARD';
    else if (paymentCode === 'PAY_ON_DELIVERY') orderName += '_DEL';
    else if (paymentCode === 'BANK_DETAILS') orderName += '_BANK';

    return res.json({
      success: true,
      redirect: `${process.env.WAYFORPAY_RETURN_BASE}/pages/thank-you?order_name=${orderName}`
    });

  } catch (error) {
    console.error('❌ Ошибка в /checkout:', error);
    return res.status(500).json({
      success: false,
      message: 'Ошибка при оформлении заказа',
      error: error.message || error
    });
  }
});

export default router;
