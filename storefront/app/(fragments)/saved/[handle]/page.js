// One saved product as HTML for @ui/saved-pages (data-endpoint="/saved"): ?section=saved-product — a
// product card in an <li> (theme/sections/saved-product.liquid), ?section=compare-column — a column of
// the compare table. A product that no longer exists answers 404: the list drops it.
import { notFound } from 'next/navigation';
import CompareColumn from '@/components/CompareColumn.js';
import ProductCard from '@/components/ProductCard.js';
import { getCompareProduct } from '@/lib/queries.js';

export default async function SavedItem({ params, searchParams }) {
  const [{ handle }, { section }] = await Promise.all([params, searchParams]);
  const product = await getCompareProduct(decodeURIComponent(handle));
  if (!product) notFound();
  if (section === 'compare-column') return <CompareColumn product={product} />;
  return (
    <li data-saved-item>
      <ProductCard product={product} quickAdd />
    </li>
  );
}
