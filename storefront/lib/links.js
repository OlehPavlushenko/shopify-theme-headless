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

// The store's time zone (Settings > General), in which Liquid reads the dates typed in the theme editor
const TIME_ZONE = process.env.SHOPIFY_TIMEZONE || 'UTC';

// Minutes the zone is ahead of UTC at that moment
function zoneOffset(time) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TIME_ZONE,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(time)
      .map(({ type, value }) => [type, Number(value)])
  );
  return (Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - time) / 60000;
}

// Dates as typed in the theme editor ("2026-12-24 23:59", store time) or ISO with a zone; blank = no
// limit (snippets/schedule-active)
export function toTime(value) {
  if (!value) return NaN;
  if (/[zZ]|[+-]\d\d:?\d\d$/.test(value)) return new Date(value).getTime();
  const wall = new Date(`${value.replace(' ', 'T')}Z`).getTime();
  return wall - zoneOffset(wall) * 60000;
}

export function scheduleActive(from, until, now = Date.now()) {
  if (from && toTime(from) > now) return false;
  if (until && toTime(until) <= now) return false;
  return true;
}
