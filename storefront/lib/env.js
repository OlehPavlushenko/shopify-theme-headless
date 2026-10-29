// Environment settings read in one place (server only; none of them is NEXT_PUBLIC_)

// The store: its myshopify domain (or mock.shop, Shopify's public demo catalog) and the API version of
// both the Storefront and the Admin API
export const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
export const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-10';

// This site's public address for absolute URLs (structured data); blank: URLs stay relative
export const SITE_URL = process.env.SITE_URL || '';

// The store's time zone (Settings > General), in which Liquid reads the dates typed in the theme editor
export const TIME_ZONE = process.env.SHOPIFY_TIMEZONE || 'UTC';
