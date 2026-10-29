// Formatting shared by server and client components
import { discountPercent } from '@ui/money';

const cents = (money) => (money ? Math.round(Number(money.amount) * 100) : 0);

// Whole-percent discount of a price against its compare-at price (MoneyV2), 0 without one: the theme's
// snippets/discount-percent rounding (@ui/money discountPercent, on cents)
export const discountOf = (price, compareAt) => discountPercent(cents(price), cents(compareAt));

// "$12.50" in the price's own currency (MoneyV2: { amount, currencyCode })
export function formatMoney({ amount, currencyCode }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount));
}

// Shopify's money format for the scripts that reprice in the browser (data-money-format, "${{amount}}"):
// formatMoney's output with the number as the placeholder
export const moneyFormat = (currencyCode) => formatMoney({ amount: 0, currencyCode }).replace(/0([.,]00)?/, '{{amount}}');

// A theme string with its {{ name }} placeholders filled in (lib/theme.js strings())
export function format(template = '', values = {}) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name) => values[name] ?? '');
}
