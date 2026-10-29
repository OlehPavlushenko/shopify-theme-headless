// The search page's results section on its own, for <facet-filters> (@ui/facets) and <load-more>
// (@ui/load-more): the same query as the page, the same markup (data-endpoint on both elements)
import { notFound } from 'next/navigation';
import MainCollection from '@/components/sections/MainCollection.js';
import { getSearchPage } from '@/lib/collection.js';
import { getTemplate } from '@/lib/theme.js';

export default async function SearchSection({ searchParams }) {
  const section = getTemplate('search').sections.find((item) => item.type === 'main-collection');
  if (!section) notFound();
  const listing = await getSearchPage(new URLSearchParams(await searchParams), { perPage: section.settings.products_per_page });
  if (!listing) notFound();
  return <MainCollection section={section} context={{ listing }} />;
}
