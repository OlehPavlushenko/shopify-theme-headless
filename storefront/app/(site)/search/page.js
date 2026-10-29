// Search page: the theme's templates/search.json — the search header (main-search), the results with
// filters, sort and "Load more" (main-collection on the search) and the products shown when nothing is
// found. noindex, as in the theme. Styles: packages/ui/css/search.css, facets.css.
import '@ui-css/facets.css';
import Sections from '@/components/Sections.js';
import { getSearchPage } from '@/lib/collection.js';
import { getTemplate, t } from '@/lib/theme.js';

const perPage = () =>
  getTemplate('search').sections.find((section) => section.type === 'main-collection')?.settings.products_per_page ?? 24;

export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams).q ?? '').trim();
  return { title: q ? `${t('search.title')}: ${q}` : t('search.title'), robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }) {
  const listing = await getSearchPage(new URLSearchParams(await searchParams), { perPage: perPage() });
  return <Sections sections={getTemplate('search').sections} context={{ template: 'search', listing }} />;
}
