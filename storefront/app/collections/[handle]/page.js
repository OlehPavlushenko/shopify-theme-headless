// Collection page: page header (breadcrumbs, h1, description), the theme's facets toolbar (count, sort)
// and product grid, 24 per page with a link to the next page. Styles: packages/ui/css/facets.css.
// Filters come with Search & Discovery on the real store (mock.shop has none).
import '@ui-css/facets.css';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/Breadcrumbs.js';
import ProductCard from '@/components/ProductCard.js';
import SortSelect from '@/components/SortSelect.js';
import { getCollection } from '@/lib/queries.js';
import { SORTS } from '@/lib/sorts.js';

export async function generateMetadata({ params }) {
  const collection = await getCollection((await params).handle);
  if (!collection) return {};
  return {
    title: collection.seo.title || collection.title,
    description: collection.seo.description || collection.description.slice(0, 160),
    alternates: { canonical: `/collections/${collection.handle}` },
  };
}

export default async function CollectionPage({ params, searchParams }) {
  const { handle } = await params;
  const { sort = 'featured', after } = await searchParams;
  const order = SORTS.find((option) => option.value === sort) ?? SORTS[0];
  const collection = await getCollection(handle, {
    sortKey: order.sortKey,
    allKey: order.allKey,
    reverse: Boolean(order.reverse),
    after: after ?? null,
  });
  if (!collection) notFound();

  const { nodes: products, pageInfo } = collection.products;
  const query = (extra) => `?${new URLSearchParams({ ...(sort !== 'featured' && { sort }), ...extra })}`;

  return (
    <>
      <div className="page-header page-header--left page-header--media-none">
        <div className="page-header__inner page-width">
          <div className="page-header__text-col">
            <Breadcrumbs current={collection.title} />
            <h1 className="h1 page-header__heading">{collection.title}</h1>
            {collection.descriptionHtml && (
              <div className="text-lead page-header__text" dangerouslySetInnerHTML={{ __html: collection.descriptionHtml }} />
            )}
          </div>
        </div>
      </div>

      <div className="main-collection section-spacing">
        <div className="page-width">
          <div className="facets__toolbar">
            <p className="facets__count" role="status">
              {products.length} {products.length === 1 ? 'product' : 'products'}
              {after ? ' on this page' : ''}
            </p>
            <div className="facets__tools">
              <SortSelect value={order.value} />
            </div>
          </div>

          <div className="facets__results">
            <h2 className="visually-hidden">Products</h2>
            {products.length > 0 ? (
              <ul className="grid facets__grid" role="list" style={{ '--cols': 4, '--cols-tablet': 3, '--cols-mobile': 2 }}>
                {products.map((product, index) => (
                  <li key={product.id}>
                    <ProductCard product={product} eager={!after && index < 4} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty-state">
                <p className="h5">No products here yet</p>
              </div>
            )}
            {(pageInfo.hasNextPage || after) && (
              <div className="load-more">
                {after && (
                  <Link href={query({})} className="btn btn--outline">
                    First page
                  </Link>
                )}
                {pageInfo.hasNextPage && (
                  <Link href={query({ after: pageInfo.endCursor })} className="btn btn--outline">
                    Next page
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
