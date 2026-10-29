// sitemap.xml: home, collections, every collection, product, page, blog and article (SITE_URL is the public
// address). The wishlist and compare pages are personal and noindex: left out.
import { SITE_URL } from '@/lib/env.js';
import { getSitemapEntries } from '@/lib/queries.js';

export const revalidate = 3600;

const PERSONAL = ['wishlist', 'compare'];

export default async function sitemap() {
  const site = SITE_URL || 'http://localhost:3000';
  const { products, collections, pages, blogs, articles } = await getSitemapEntries();
  return [
    { url: `${site}/` },
    { url: `${site}/collections` },
    ...collections.map((collection) => ({ url: `${site}/collections/${collection.handle}`, lastModified: collection.updatedAt })),
    ...products.map((product) => ({ url: `${site}/products/${product.handle}`, lastModified: product.updatedAt })),
    ...pages
      .filter((page) => !PERSONAL.includes(page.handle))
      .map((page) => ({ url: `${site}/pages/${page.handle}`, lastModified: page.updatedAt })),
    ...blogs.map((blog) => ({ url: `${site}/blogs/${blog.handle}` })),
    ...articles.map((article) => ({ url: `${site}/blogs/${article.blog.handle}/${article.handle}`, lastModified: article.publishedAt })),
  ];
}
