// sitemap.xml: home, collections, every collection and product (SITE_URL is the public address)
import { getSitemapEntries } from '@/lib/queries.js';

export const revalidate = 3600;

export default async function sitemap() {
  const site = process.env.SITE_URL || 'http://localhost:3000';
  const { products, collections } = await getSitemapEntries();
  return [
    { url: `${site}/` },
    { url: `${site}/collections` },
    ...collections.map((collection) => ({ url: `${site}/collections/${collection.handle}`, lastModified: collection.updatedAt })),
    ...products.map((product) => ({ url: `${site}/products/${product.handle}`, lastModified: product.updatedAt })),
  ];
}
