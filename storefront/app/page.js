// Home page. First version: best sellers as the theme's Product list section (grid).
import ProductCard from '@/components/ProductCard.js';
import { configured } from '@/lib/shopify.js';
import { getProducts, getShell } from '@/lib/queries.js';

export default async function Home() {
  const [{ shop }, products] = await Promise.all([getShell(), getProducts(8)]);
  return (
    <div className="product-list section-spacing">
      {/* One h1 per page: on the home page, the shop name */}
      <h1 className="visually-hidden">{shop.name}</h1>
      <div className="page-width">
        <div className="section-head">
          <h2 className="h3 section-head__title">Best sellers</h2>
        </div>
        {products.length > 0 ? (
          <ul className="grid product-list__grid" role="list" style={{ '--grid-columns': 4, '--grid-columns-mobile': 2 }}>
            {products.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} eager={index < 4} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-lead">
            {configured
              ? 'No products yet.'
              : 'Connect the store: SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in storefront/.env.local.'}
          </p>
        )}
      </div>
    </div>
  );
}
