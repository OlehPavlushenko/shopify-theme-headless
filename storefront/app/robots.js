// robots.txt: everything but the cart and search (as Shopify's own robots.txt), plus the sitemap
export default function robots() {
  const site = process.env.SITE_URL || 'http://localhost:3000';
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/cart', '/search'] },
    sitemap: `${site}/sitemap.xml`,
  };
}
