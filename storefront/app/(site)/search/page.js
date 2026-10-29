// Search page: the theme's templates/search.json — the search header (main-search), the results with
// filters, sort and "Load more" (main-collection on the search) and the products shown when nothing is
// found; with view=blog (the blog search field) templates/search.blog.json — the blog's page header and
// the matching articles (main-blog). noindex, as in the theme. Styles: packages/ui/css/search.css, facets.css.
import '@ui-css/facets.css';
import Sections from '@/components/Sections.js';
import { blogListing, blogTitle } from '@/lib/blog.js';
import { getSearchPage } from '@/lib/collection.js';
import { findSection, t } from '@/lib/theme.js';

export async function generateMetadata({ searchParams }) {
  const query = new URLSearchParams(await searchParams);
  const q = (query.get('q') ?? '').trim();
  const robots = { index: false, follow: true };
  if (query.get('view') === 'blog') {
    const list = await blogListing(['search'], query);
    if (list) return { title: blogTitle(list.listing), robots };
  }
  return { title: q ? `${t('search.title')}: ${q}` : t('search.title'), robots };
}

export default async function SearchPage({ searchParams }) {
  const query = new URLSearchParams(await searchParams);
  if (query.get('view') === 'blog') {
    const list = await blogListing(['search'], query);
    if (list) return <Sections sections={list.sections} context={{ template: 'search', blog: list.listing.blog, listing: list.listing }} />;
  }
  const { section, sections } = findSection('search', 'main-collection');
  const listing = await getSearchPage(query, { perPage: section?.settings.products_per_page ?? 24 });
  return <Sections sections={sections} context={{ template: 'search', listing }} />;
}
