// Theme setting values as storefront paths and checks (the theme's url settings and schedule-active)

// "shopify://collections/x" -> "/collections/x" (also products, pages, blogs, search); store URLs -> paths
export function linkUrl(value) {
  if (!value) return null;
  const internal = value.match(/^shopify:\/\/(collections|products|pages|blogs|search)(\/.*)?$/);
  if (internal) return `/${internal[1]}${internal[2] ?? ''}`;
  try {
    const url = new URL(value);
    return url.hostname.endsWith('.myshopify.com') ? url.pathname + url.search : value;
  } catch {
    return value;
  }
}

// Dates as typed in the theme editor ("2026-12-24 23:59"); blank = no limit (snippets/schedule-active)
export const toTime = (value) => (value ? new Date(value.replace(' ', 'T')).getTime() : NaN);

export function scheduleActive(from, until, now = Date.now()) {
  if (from && toTime(from) > now) return false;
  if (until && toTime(until) <= now) return false;
  return true;
}
