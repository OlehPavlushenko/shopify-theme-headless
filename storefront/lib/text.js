// Text helpers shared by the components: the Liquid filters and date format the theme's markup relies on
import { TIME_ZONE } from './env.js';

// Liquid's escape: plain text made safe inside HTML (dangerouslySetInnerHTML, the values of the *_html strings)
export const escapeHtml = (text = '') => String(text).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// Liquid's truncatewords: the first n words and "..."
export function truncateWords(text, n) {
  const words = text.trim().split(/\s+/);
  return words.length > n ? `${words.slice(0, n).join(' ')}...` : text.trim();
}

// A date in the store's time zone, as Liquid's date filter prints it there: 'long' "October 29, 2026",
// 'numeric' "10/29/2026"
const DATE_FORMATS = {
  long: { month: 'long', day: 'numeric', year: 'numeric' },
  numeric: { month: '2-digit', day: '2-digit', year: 'numeric' },
};
export function formatDate(iso, style = 'long') {
  return new Intl.DateTimeFormat('en-US', { ...DATE_FORMATS[style], timeZone: TIME_ZONE }).format(new Date(iso));
}

// JSON text for an inline <script> ("<" escaped, so a value can't close the tag)
export const scriptJson = (json) => json.replace(/</g, '\\u003c');
