// Product card: the same markup as theme/snippets/product-card.liquid (styles: packages/ui/css/product-card.css).
// First version: image (second image on hover), sold-out / "−X%" / sale badge, vendor, title, price.
// Data: the ProductCard fragment (lib/queries.js).
import Image from 'next/image';
import Link from 'next/link';
import Price from './Price.js';

const SIZES = '(min-width: 990px) calc((100vw - 10rem) / 4), (min-width: 750px) calc((100vw - 6rem) / 3), calc((100vw - 4rem) / 2)';

function discountPercent(price, compareAt) {
  if (!compareAt || Number(compareAt.amount) <= Number(price.amount)) return 0;
  return Math.round((1 - Number(price.amount) / Number(compareAt.amount)) * 100);
}

export default function ProductCard({ product, eager = false, headingTag: Heading = 'h3', showVendor = false }) {
  const image = product.featuredImage;
  const second = product.images.nodes[1];
  const variant = product.selectedOrFirstAvailableVariant;
  const discount = variant ? discountPercent(variant.price, variant.compareAtPrice) : 0;
  const onSale =
    !discount && Number(product.compareAtPriceRange.maxVariantPrice.amount) > Number(product.priceRange.minVariantPrice.amount);
  const differentPrices = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const url = `/products/${product.handle}`;

  let badge = null;
  if (!product.availableForSale) badge = <span className="pill pill--soft product-card__badge">Sold out</span>;
  else if (discount > 0) badge = <span className="pill product-card__badge">−{discount}%</span>;
  else if (onSale) badge = <span className="pill product-card__badge">Sale</span>;

  return (
    <article className={`product-card${second ? ' product-card--hover' : ''}`}>
      <div className="product-card__media frame" style={{ '--frame-ratio': 1 }}>
        {image && (
          <Image
            className="product-card__image"
            src={image.url}
            alt={image.altText || product.title}
            width={image.width}
            height={image.height}
            sizes={SIZES}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
          />
        )}
        {second && (
          <Image
            className="product-card__image product-card__image--secondary"
            src={second.url}
            alt=""
            width={second.width}
            height={second.height}
            sizes={SIZES}
          />
        )}
      </div>

      {/* One link over the whole card; buttons inside the card sit above it */}
      <Link href={url} className="product-card__overlay" aria-label={product.title} />

      {badge}

      <div className="product-card__info">
        {showVendor && product.vendor && <p className="product-card__vendor">{product.vendor}</p>}
        <Heading className="product-card__title line-clamp">{product.title}</Heading>
        <Price
          price={differentPrices ? product.priceRange.minVariantPrice : (variant?.price ?? product.priceRange.minVariantPrice)}
          compareAt={variant?.compareAtPrice}
          from={differentPrices}
        />
      </div>
    </article>
  );
}
