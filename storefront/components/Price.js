// Price tag: the same markup as theme/snippets/price.liquid (styles: .price-tag in packages/ui/css/components.css).
// price / compareAt: MoneyV2 ({ amount, currencyCode }); from: "From $10" for products with different prices.
// live: the product's own price that <product-info> (@ui/variant-picker) updates for the picked variant —
// [data-product-price], the compare price always present ([hidden] when not on sale).
import { formatMoney } from '@/lib/format.js';

// A product's price on cards and rows: "From" the lowest price when its variants' prices differ, else the
// first available variant's price against its compare-at price
export function ProductPrice({ product }) {
  const { minVariantPrice, maxVariantPrice } = product.priceRange;
  const variant = product.selectedOrFirstAvailableVariant;
  const from = minVariantPrice.amount !== maxVariantPrice.amount;
  return <Price price={from ? minVariantPrice : (variant?.price ?? minVariantPrice)} compareAt={variant?.compareAtPrice} from={from} />;
}

export default function Price({ price, compareAt, from = false, live = false, className }) {
  const onSale = compareAt && Number(compareAt.amount) > Number(price.amount);
  return (
    <span
      className={`price-tag${onSale ? ' price-tag--sale' : ''}${className ? ` ${className}` : ''}`}
      data-product-price={live ? '' : undefined}
    >
      <span className="price-tag__current">{from ? `From ${formatMoney(price)}` : formatMoney(price)}</span>
      {live ? (
        <s className="price-tag__compare" hidden={!onSale}>
          <span className="visually-hidden">Regular price</span>
          <span data-compare-value="">{onSale ? formatMoney(compareAt) : ''}</span>
        </s>
      ) : (
        onSale &&
        !from && (
          <s className="price-tag__compare">
            <span className="visually-hidden">Regular price</span>
            {formatMoney(compareAt)}
          </s>
        )
      )}
    </span>
  );
}
