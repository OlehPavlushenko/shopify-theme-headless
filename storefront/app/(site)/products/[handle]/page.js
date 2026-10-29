// Product page: the theme's main-product layout (grid gallery, info column) — breadcrumbs, gallery,
// vendor, title, price, variant picker (links, ?Option=Value), quantity and add to cart, description;
// metadata and Product structured data. Styles: packages/ui/css/product.css.
import '@ui-css/product.css';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import AddToCart from '@/components/AddToCart.js';
import Breadcrumbs from '@/components/Breadcrumbs.js';
import JsonLd from '@/components/JsonLd.js';
import Price from '@/components/Price.js';
import VariantPicker from '@/components/VariantPicker.js';
import { getProduct } from '@/lib/queries.js';
import { getSettings } from '@/lib/theme.js';

const toOptions = (searchParams) => Object.entries(searchParams).map(([name, value]) => ({ name, value: String(value) }));

export async function generateMetadata({ params, searchParams }) {
  const product = await getProduct((await params).handle, toOptions(await searchParams));
  if (!product) return {};
  const image = product.featuredImage;
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description.slice(0, 160),
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: { type: 'website', images: image ? [{ url: image.url, width: image.width, height: image.height }] : [] },
  };
}

export default async function ProductPage({ params, searchParams }) {
  const product = await getProduct((await params).handle, toOptions(await searchParams));
  if (!product) notFound();

  const variant = product.selectedOrFirstAvailableVariant;
  const singleVariant = product.variants.nodes.length === 1;
  // The picked variant's image first, then the rest
  const images = product.images.nodes;
  const media = variant?.image ? [variant.image, ...images.filter((image) => image.id !== variant.image.id)] : images;
  const collection = product.collections.nodes[0];
  const siteUrl = process.env.SITE_URL || '';

  return (
    <div className="main-product main-product--grid main-product--info-plain">
      <div className="page-width main-product__crumbs">
        <Breadcrumbs
          trail={collection ? [{ title: collection.title, url: `/collections/${collection.handle}` }] : []}
          current={product.title}
        />
      </div>
      <div className="page-width main-product__inner">
        <div className="main-product__head">
          <h1 className="h2 main-product__title">{product.title}</h1>
        </div>

        <div className="product-gallery product-gallery--grid sticky-column">
          <ul className="scroll-track product-gallery__track" role="list">
            {media.map((image, index) => (
              <li key={image.id ?? image.url} className="product-gallery__item">
                <div className="frame" style={{ '--frame-ratio': 1 }}>
                  <Image
                    src={image.url}
                    alt={image.altText || product.title}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 990px) 30vw, 100vw"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : undefined}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="main-product__info sticky-column">
          <div className="main-product__info-inner">
            {product.vendor && <p className="main-product__vendor">{product.vendor}</p>}
            {variant && (
              <div className="main-product__price">
                <Price price={variant.price} compareAt={variant.compareAtPrice} />
              </div>
            )}
            {!singleVariant && variant && (
              <div className="main-product__picker">
                <VariantPicker product={product} selected={variant} />
              </div>
            )}
            {variant && (
              <AddToCart
                variantId={variant.id}
                available={variant.availableForSale}
                productTitle={product.title}
                openDrawer={getSettings().cart_type === 'drawer'}
              />
            )}
            {product.descriptionHtml && <div className="rte" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />}
          </div>
        </div>
      </div>

      {variant && (
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.title,
            description: product.description,
            image: images.map((image) => image.url),
            brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
            sku: variant.sku || undefined,
            url: `${siteUrl}/products/${product.handle}`,
            offers: {
              '@type': 'Offer',
              price: variant.price.amount,
              priceCurrency: variant.price.currencyCode,
              availability: `https://schema.org/${variant.availableForSale ? 'InStock' : 'OutOfStock'}`,
              url: `${siteUrl}/products/${product.handle}`,
            },
          }}
        />
      )}
    </div>
  );
}
