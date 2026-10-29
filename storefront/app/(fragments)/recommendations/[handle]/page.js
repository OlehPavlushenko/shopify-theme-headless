// Related products of a product as rows for <cart-recommendations> (lib/cart-recommendations.js):
// theme/sections/cart-recommendations.liquid — available products only, 10 at most, compact rows with add
import ProductRow from '@/components/ProductRow.js';
import { getProductRecommendations } from '@/lib/product.js';

export default async function Recommendations({ params }) {
  const { handle } = await params;
  const products = (await getProductRecommendations(decodeURIComponent(handle), 'RELATED')).filter((product) => product.availableForSale);
  return (
    <ul role="list">
      {products.slice(0, 10).map((product) => (
        <ProductRow key={product.id} product={product} add />
      ))}
    </ul>
  );
}
