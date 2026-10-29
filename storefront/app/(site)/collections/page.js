// Collections page: page header and every collection as a card grid (the theme's list-collections
// template: page-header + main-list-collections, Grid layout)
import CollectionCard from '@/components/CollectionCard.js';
import PageHeader from '@/components/PageHeader.js';
import { getCollections } from '@/lib/queries.js';

export const metadata = { title: 'Collections', alternates: { canonical: '/collections' } };

export default async function CollectionsPage() {
  const collections = await getCollections();
  return (
    <>
      <PageHeader heading="Collections" />
      <div className="main-collections main-collections--grid section-spacing">
        <div className="page-width">
          <ul
            className="main-collections__list grid main-collections__grid"
            role="list"
            style={{ '--grid-columns': 4, '--grid-columns-mobile': 2 }}
          >
            {collections.map((collection) => (
              <li key={collection.handle}>
                <CollectionCard collection={collection} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
