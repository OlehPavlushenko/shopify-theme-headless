// Price tag: the same markup as theme/snippets/price.liquid (styles: .price-tag in packages/ui/css/components.css).
// price / compareAt: MoneyV2 ({ amount, currencyCode }); from: "From $10" for products with different prices.
import { formatMoney } from '@/lib/shopify.js';

export default function Price({ price, compareAt, from = false }) {
  const onSale = compareAt && Number(compareAt.amount) > Number(price.amount);
  return (
    <span className={`price-tag${onSale ? ' price-tag--sale' : ''}`}>
      <span className="price-tag__current">{from ? `From ${formatMoney(price)}` : formatMoney(price)}</span>
      {onSale && !from && (
        <s className="price-tag__compare">
          <span className="visually-hidden">Regular price</span>
          {formatMoney(compareAt)}
        </s>
      )}
    </span>
  );
}
