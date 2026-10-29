// robots.txt: everything but the cart and search (as Shopify's own robots.txt), plus the sitemap
import { SITE_URL } from '@/lib/env.js';

export default function robots() {
  const site = SITE_URL || 'http://localhost:3000';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/search'] },
    sitemap: `${site}/sitemap.xml`,
  };
}
