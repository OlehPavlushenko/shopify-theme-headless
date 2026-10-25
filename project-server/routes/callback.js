import express from 'express';
import multer from 'multer';

import crypto from 'crypto';
import { completeDraftOrder } from '../services/completeDraftOrder.js';
import { updateDraftOrder } from '../services/updateDraftOrder.js';
import { orderMarkAsPaid } from '../services/orderMarkAsPaid.js';
import { updateEmailMarketingConsent, updateTags } from '../services/customer.js';

const router = express.Router();
const SECRET_KEY = process.env.WAYFORPAY_SECRET_KEY;
const upload = multer();

function generateSignature(data, secret) {
  const keys = [
    'merchantAccount',
    'orderReference',
    'amount',
    'currency',
    'authCode',
    'cardPan',
    'transactionStatus',
    'reasonCode'
  ];
  const toSign = keys.map(k => data[k] || '').join(';');
  const signature = crypto
    .createHmac('md5', secret)
    .update(toSign)
    .digest('hex');
  return signature;
}

router.post('/', upload.none(), async (req, res) => {
  const data = req.body;

  const signature = generateSignature(data, SECRET_KEY);
  if (signature !== data.merchantSignature) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  const orderIdRaw = data.orderReference;
  const draftIdMatch = orderIdRaw.match(/^([0-9]+)_CARD$/);
  if (!draftIdMatch) {
    return res.status(400).json({ error: 'Invalid orderReference format' });
  }

  const draftId = draftIdMatch[1];
  const draftGid = `gid://shopify/DraftOrder/${draftId}`;
  const transactionStatus = data.transactionStatus;

  let orderName = null;
  const redirectBase = process.env.WAYFORPAY_RETURN_BASE || '';
  
  try {
    if (transactionStatus === 'Approved') {
      const order = await completeDraftOrder(draftGid);
      if (order?.customer?.id) {
        updateEmailMarketingConsent(order.customer.id)
          .then(() => updateTags(order.customer.id, ['checkout-subscribe']))
          .catch((e) => {
            console.error('❌ Не удалось подписать кастомера после заказа (фон):', e);
          });
      }

      try {
        await orderMarkAsPaid(order.id);

        orderName = order.name + '_CARD';
        const redirectUrlParam = `${redirectBase}/pages/thank-you?order_name=${orderName}`;

        return res.redirect(303, redirectUrlParam);
      } catch (err) {
        console.error('❌ Ошибка при orderMarkAsPaid:', err);
        const redirectUrlParam = `${redirectBase}/pages/thank-you`;

        return res.redirect(303, redirectUrlParam);
      }
    } else {
      const newNote = `[${new Date().toISOString()}] WAYFORPAY FAILED: ${data.reasonCode || ''} ${data.reason || ''}`;

      try {
        await updateDraftOrder(draftGid, newNote);
      } catch (e) {
        console.error('❌ Ошибка при updateDraftOrder:', e);
      }

      const order = await completeDraftOrder(draftGid);
      if (order?.customer?.id) {
        updateEmailMarketingConsent(order.customer.id)
          .then(() => updateTags(order.customer.id, ['checkout-subscribe']))
          .catch((e) => {
            console.error('❌ Не удалось подписать кастомера после заказа (фон):', e);
          });
      }

      const redirectUrlParam = `${redirectBase}/pages/thank-you`;

      return res.redirect(303, redirectUrlParam);
    }
   
  } catch (error) {
    console.error('❌ WayForPay callback critical error:', error);
    const redirectUrl = `${process.env.WAYFORPAY_RETURN_BASE || ''}/pages/thank-you`;

    return res.redirect(303, redirectUrl);
  }
});

export default router;
