// Formatting shared by server and client components

// "$12.50" in the price's own currency (MoneyV2: { amount, currencyCode })
export function formatMoney({ amount, currencyCode }) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(Number(amount));
}

// A theme string with its {{ name }} placeholders filled in (lib/theme.js strings())
export function format(template = '', values = {}) {
  return template.replace(/{{\s*(\w+)\s*}}/g, (_, name) => values[name] ?? '');
}
