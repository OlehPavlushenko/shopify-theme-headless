// The collection page's product grid section on its own, for <facet-filters> (@ui/facets) and <load-more>
// (@ui/load-more): the same query as the page, the same markup (data-endpoint on both elements)
import { notFound } from 'next/navigation';
import MainCollection from '@/components/sections/MainCollection.js';
import { getCollectionPage } from '@/lib/collection.js';
import { findSection } from '@/lib/theme.js';

export default async function CollectionSection({ params, searchParams }) {
  const [{ handle }, query] = await Promise.all([params, searchParams]);
  const { section } = findSection('collection', 'main-collection');
  if (!section) notFound();
  const listing = await getCollectionPage(handle, new URLSearchParams(query), { perPage: section.settings.products_per_page });
  if (!listing) notFound();
  return <MainCollection section={section} context={{ listing }} />;
}
