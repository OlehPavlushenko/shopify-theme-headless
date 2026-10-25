import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const {
  WAYFORPAY_MERCHANT_LOGIN,
  WAYFORPAY_SECRET_KEY,
  WAYFORPAY_CALLBACK_URL
} = process.env;

export function generateWayforpayForm({ orderReference, orderDate, amount, products, customer}) {
  const signString = [
    WAYFORPAY_MERCHANT_LOGIN,
    'bioharmony.com.ua',
    orderReference,
    orderDate,
    amount,
    'UAH',
    ...products.map(p => p.name),
    ...products.map(p => p.count),
    ...products.map(p => p.price)
  ].join(';');

  const merchantSignature = crypto
    .createHmac('md5', WAYFORPAY_SECRET_KEY)
    .update(signString)
    .digest('hex');

  const payload = {
    merchantAccount: WAYFORPAY_MERCHANT_LOGIN,
    merchantDomainName: 'bioharmony.com.ua',
    orderReference,
    orderDate,
    amount,
    currency: 'UAH',
    productName: products.map(p => p.name),
    productPrice: products.map(p => p.price),
    productCount: products.map(p => p.count),
    clientFirstName: customer.firstName,
    clientLastName: customer.lastName,
    clientEmail: customer.email,
    clientPhone: customer.phone,
    returnUrl: WAYFORPAY_CALLBACK_URL,
    merchantSignature
  };

  const html = `
    <html>
      <body>
        <form method="POST" id="wayforpay-form" action="https://secure.wayforpay.com/pay">
          ${Object.entries(payload).map(([key, value]) => {
            if (Array.isArray(value)) {
              return value.map(val => `<input type="hidden" name="${key}[]" value="${val}">`).join('');
            }
            return `<input type="hidden" name="${key}" value="${value}">`;
          }).join('\n')}
          <input type="hidden" name="language" value="UA" />
        </form>
        <script>document.getElementById('wayforpay-form').submit();</script>
      </body>
    </html>
  `;

  return html;
}
