// Collection page: the theme's templates/collection.json — page header (image, subcollections), the
// product grid with filters, sort, density and "Load more" (main-collection), the collection's SEO text
// and the FAQ, with the same settings as in the theme editor. Filtered and paged lists are noindex, as in
// the theme. Styles: packages/ui/css/facets.css.
import '@ui-css/facets.css';
import { notFound } from 'next/navigation';
import Sections from '@/components/Sections.js';
import { getCollectionPage } from '@/lib/collection.js';
import { findSection } from '@/lib/theme.js';

// The listing for the URL (the request's queries are memoized: generateMetadata and the page share them)
async function load(params, searchParams) {
  const [{ handle }, search] = await Promise.all([params, searchParams]);
  const query = new URLSearchParams(search);
  const { section, sections } = findSection('collection', 'main-collection');
  const listing = await getCollectionPage(handle, query, { perPage: section?.settings.products_per_page ?? 16 });
  return { handle, query, sections, listing };
}

export async function generateMetadata({ params, searchParams }) {
  const { handle, query, listing } = await load(params, searchParams);
  if (!listing) return {};
  const { collection } = listing;
  const filtered = [...query.keys()].some((key) => key.startsWith('filter.') || key === 'after');
  return {
    title: collection.seo?.title || collection.title,
    description: collection.seo?.description || collection.description?.slice(0, 160),
    alternates: { canonical: `/collections/${handle}` },
    ...(filtered && { robots: { index: false, follow: true } }),
  };
}

export default async function CollectionPage({ params, searchParams }) {
  const { sections, listing } = await load(params, searchParams);
  if (!listing) notFound();
  return (
    <Sections
      sections={sections}
      context={{ template: 'collection', collection: listing.collection, subcollections: listing.collection.subcollections, listing }}
    />
  );
}
