// Star rating from the standard reviews metafields (reviews.rating, reviews.rating_count — written by
// review apps): theme/snippets/rating.liquid. "(12)", or with full "4.8 · 12 reviews". Nothing without reviews.
import { t } from '@/lib/theme.js';

export default function Rating({ product, full = false, className }) {
  if (!product.rating?.value) return null;
  const rating = JSON.parse(product.rating.value);
  const value = Number(rating.value);
  const max = Number(rating.scale_max);
  const count = Number(product.ratingCount?.value ?? 0);
  return (
    <span className={`rating-line${className ? ` ${className}` : ''}`}>
      <span className="rating" style={{ '--rating': `${(value / max) * 100}%` }} aria-hidden="true" />
      <span className="visually-hidden">
        {t('products.rating', { rating: value, max })}, {t('products.reviews_count', { count })}
      </span>
      <span className="rating-line__count" aria-hidden="true">
        {full ? `${Math.round(value * 10) / 10} · ${t('products.reviews_count', { count })}` : `(${count})`}
      </span>
    </span>
  );
}
