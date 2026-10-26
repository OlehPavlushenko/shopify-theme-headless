/* Generated from packages/ui/js/money.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Formats an amount in minor units (cents) with a Shopify money format string,
 * e.g. formatMoney(125990, '${{amount}}') -> "$1,259.90".
 * Pure function: the theme passes shop.money_format, a headless storefront passes the format
 * from the Storefront API (shop.paymentSettings / currency) or uses Intl.NumberFormat instead.
 */
const FORMATS = {
  amount: [2, ',', '.'],
  amount_no_decimals: [0, ',', '.'],
  amount_with_comma_separator: [2, '.', ','],
  amount_no_decimals_with_comma_separator: [0, '.', ','],
  amount_with_apostrophe_separator: [2, "'", '.'],
  amount_with_space_separator: [2, ' ', ','],
  amount_with_period_and_space_separator: [2, ' ', '.'],
};

export function formatMoney(cents, format = '${{amount}}') {
  const value = Number(cents) / 100;
  return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
    const [decimals, thousands, decimal] = FORMATS[key] ?? FORMATS.amount;
    const [int, frac] = value.toFixed(decimals).split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (frac ? decimal + frac : '');
  });
}

// Whole-percent discount of price against its "was" price; 0 when there is none
// (same rounding as theme/snippets/discount-percent.liquid)
export function discountPercent(price, compareAt) {
  return compareAt > price ? Math.round(((compareAt - price) * 100) / compareAt) : 0;
}
