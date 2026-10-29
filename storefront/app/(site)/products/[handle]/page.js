// Product page: the theme's templates/product.json — main-product (gallery, info blocks, sticky bar),
// the product story, related products, the FAQ and recently viewed, with the same settings as in the
// theme editor; metadata and Product structured data. The picked variant: ?variant=<id> (what the page
// writes to the URL on a pick, as in the theme) or ?<Option>=<Value>. Styles: packages/ui/css/product.css.
import '@ui-css/product.css';
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd.js';
import Sections from '@/components/Sections.js';
import { taxesIncluded } from '@/lib/admin.js';
import { SITE_URL } from '@/lib/env.js';
import { numericId } from '@/lib/ids.js';
import { getProductPage } from '@/lib/product.js';
import { getTemplate } from '@/lib/theme.js';

// The product for the URL (the request's queries are memoized, lib/shopify.js: generateMetadata and the
// page share them)
async function load(params, searchParams) {
  const [{ handle }, query] = await Promise.all([params, searchParams]);
  const { variant: variantId, ...options } = query;
  const product = await getProductPage(
    handle,
    Object.entries(options).map(([name, value]) => ({ name, value: String(value) }))
  );
  if (!product) return null;
  // ?variant=<id>: that variant (with the picked variant's fields the page reads)
  const picked = variantId && product.variants.nodes.find((variant) => numericId(variant.id) === Number(variantId));
  return picked ? { ...product, selectedOrFirstAvailableVariant: { ...product.selectedOrFirstAvailableVariant, ...picked } } : product;
}

export async function generateMetadata({ params, searchParams }) {
  const product = await load(params, searchParams);
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
  const [product, taxes] = await Promise.all([load(params, searchParams), taxesIncluded()]);
  if (!product) notFound();
  const variant = product.selectedOrFirstAvailableVariant ?? product.variants.nodes[0];
  const rating = product.rating?.value ? JSON.parse(product.rating.value) : null;
  return (
    <>
      <Sections sections={getTemplate('product').sections} context={{ template: 'product', product, taxesIncluded: taxes }} />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.title,
          description: product.description,
          image: product.media.nodes.filter((item) => item.image).map((item) => item.image.url),
          brand: product.vendor ? { '@type': 'Brand', name: product.vendor } : undefined,
          sku: variant.sku || undefined,
          url: `${SITE_URL}/products/${product.handle}`,
          ...(rating && {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: rating.value,
              bestRating: rating.scale_max,
              ratingCount: product.ratingCount?.value,
            },
          }),
          offers: product.variants.nodes.map((item) => ({
            '@type': 'Offer',
            price: item.price.amount,
            priceCurrency: item.price.currencyCode,
            availability: `https://schema.org/${item.availableForSale ? 'InStock' : 'OutOfStock'}`,
            url: `${SITE_URL}/products/${product.handle}?variant=${numericId(item.id)}`,
          })),
        }}
      />
    </>
  );
}
