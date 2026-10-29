// Compact product row: theme/snippets/product-row.liquid (without the add button) — thumbnail, title, price
import Image from 'next/image';
import Link from 'next/link';
import Price from './Price.js';

export default function ProductRow({ product }) {
  const url = `/products/${product.handle}`;
  const image = product.featuredImage;
  const differentPrices = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const variant = product.selectedOrFirstAvailableVariant;
  return (
    <li className="product-row">
      <Link href={url} className="frame product-row__media" style={{ '--frame-ratio': 1 }} tabIndex={-1} aria-hidden="true">
        {image && <Image src={image.url} alt="" width={120} height={120} sizes="60px" />}
      </Link>
      <div className="product-row__info">
        <Link href={url} className="product-row__title line-clamp">
          {product.title}
        </Link>
        <Price
          price={differentPrices ? product.priceRange.minVariantPrice : (variant?.price ?? product.priceRange.minVariantPrice)}
          compareAt={variant?.compareAtPrice}
          from={differentPrices}
        />
      </div>
    </li>
  );
}
