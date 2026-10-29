// Compact product row: theme/snippets/product-row.liquid — thumbnail, title, price and (add) an add button
// for one-variant products (<cart-item-state>, lib/cart-elements.js; a check while just added) or a link
// to the product. Rows of the footer's product list, the cart recommendations.
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import { ProductPrice } from './Price.js';
import { hasOnlyDefaultVariant } from '@/lib/ids.js';
import { t } from '@/lib/theme.js';

export default function ProductRow({ product, add = false }) {
  const url = `/products/${product.handle}`;
  const image = product.featuredImage;
  const variant = product.selectedOrFirstAvailableVariant;
  const single = hasOnlyDefaultVariant(product);
  return (
    <li className="product-row" data-product-handle={product.handle}>
      <Link href={url} className="frame product-row__media" style={{ '--frame-ratio': 1 }} tabIndex={-1} aria-hidden="true">
        {image && <Image src={image.url} alt="" width={120} height={120} sizes="60px" />}
      </Link>
      <div className="product-row__info">
        <Link href={url} className="product-row__title line-clamp">
          {product.title}
        </Link>
        <ProductPrice product={product} />
      </div>
      {add &&
        (single && variant ? (
          <cart-item-state data-variant-id={variant.id}>
            <form>
              <input type="hidden" name="merchandiseId" value={variant.id} />
              <button type="submit" className="btn btn--outline btn--icon" aria-label={`${t('products.add_to_cart')}: ${product.title}`}>
                <span className="btn__state">
                  <Icon name="plus" />
                </span>
                <span className="btn__state btn__state--done">
                  <Icon name="check" />
                </span>
              </button>
            </form>
          </cart-item-state>
        ) : (
          <a href={url} className="btn btn--outline btn--icon" aria-label={product.title}>
            <Icon name="arrow-right" />
          </a>
        ))}
    </li>
  );
}
