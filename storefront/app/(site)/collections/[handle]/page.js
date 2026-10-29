// Collection page: the theme's templates/collection.json — page header (image, subcollections), the
// product grid with filters, sort, density and "Load more" (main-collection), the collection's SEO text
// and the FAQ, with the same settings as in the theme editor. Filtered and paged lists are noindex, as in
// the theme. Styles: packages/ui/css/facets.css.
import '@ui-css/facets.css';
import { notFound } from 'next/navigation';
import Sections from '@/components/Sections.js';
import { getCollectionPage } from '@/lib/collection.js';
import { getTemplate } from '@/lib/theme.js';

const perPage = () =>
  getTemplate('collection').sections.find((section) => section.type === 'main-collection')?.settings.products_per_page ?? 16;

export async function generateMetadata({ params, searchParams }) {
  const { handle } = await params;
  const query = new URLSearchParams(await searchParams);
  const listing = await getCollectionPage(handle, query, { perPage: perPage() });
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
  const { handle } = await params;
  const listing = await getCollectionPage(handle, new URLSearchParams(await searchParams), { perPage: perPage() });
  if (!listing) notFound();
  const { sections } = getTemplate('collection');
  return (
    <Sections
      sections={sections}
      context={{ template: 'collection', collection: listing.collection, subcollections: listing.collection.subcollections, listing }}
    />
  );
}
