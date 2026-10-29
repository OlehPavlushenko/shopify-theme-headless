// The product's reviews where the theme has Judge.me's review widget (an app block in the Apps section):
// the same content from the data the widget renders (lib/admin.js judgeMeReviews) — the heading, the
// average and count, "Write a review" (a popup, components/ReviewForm.js), the reviews with stars
// (.rating, as on the cards), reviewer, date, title and text. id judgeme_product_reviews: the rating
// under the product title links here. Styles: .product-reviews in product.css.
import Popup from './Popup.js';
import ReviewForm from './ReviewForm.js';
import { judgeMeReviews } from '@/lib/admin.js';
import { numericId } from '@/lib/ids.js';
import { formatDate } from '@/lib/text.js';
import { t } from '@/lib/theme.js';

export default async function ProductReviews({ product }) {
  const data = await judgeMeReviews(product.id);
  const reviews = data?.reviews ?? [];
  const average = Number(data?.average_rating ?? 0);
  const formId = 'WriteReview';
  const labels = {
    rating: t('reviews.rating'),
    stars: Object.fromEntries([1, 2, 3, 4, 5].map((count) => [count, t('reviews.star', { count })])),
    name: t('reviews.name'),
    email: t('reviews.email'),
    title: t('reviews.review_title'),
    body: t('reviews.body'),
    submit: t('reviews.submit'),
    success: t('reviews.success'),
    error: t('reviews.error'),
  };
  return (
    <section className="product-reviews" id="judgeme_product_reviews" aria-labelledby="ProductReviews-title">
      <div className="product-reviews__head">
        <div>
          <h2 id="ProductReviews-title" className="h2 product-reviews__title">
            {t('reviews.title')}
          </h2>
          {reviews.length > 0 ? (
            <p className="product-reviews__average">
              <span className="product-reviews__value">{Math.round(average * 10) / 10}</span>
              {t('products.reviews_count', { count: data.number_of_reviews })}
            </p>
          ) : (
            <p className="product-reviews__average">{t('reviews.empty')}</p>
          )}
        </div>
        <button type="button" className="btn product-reviews__write" data-dialog-open={formId}>
          {t('reviews.write')}
        </button>
      </div>

      {reviews.length > 0 && (
        <ol className="product-reviews__list" role="list">
          {reviews.map((review) => (
            <li key={review.uuid} className="product-reviews__item">
              <span className="rating" style={{ '--rating': `${(review.rating / 5) * 100}%` }} aria-hidden="true" />
              <span className="visually-hidden">{t('products.rating', { rating: review.rating, max: 5 })}</span>
              <div className="product-reviews__author">
                <span className="product-reviews__avatar" aria-hidden="true">
                  {review.reviewer_initial}
                </span>
                <span>
                  <span className="product-reviews__name">{review.reviewer_name}</span>
                  <time className="product-reviews__date" dateTime={review.created_at}>
                    {formatDate(review.created_at, 'numeric')}
                  </time>
                </span>
              </div>
              {review.title && <h3 className="product-reviews__review-title">{review.title}</h3>}
              <div className="product-reviews__body" dangerouslySetInnerHTML={{ __html: review.body_html }} />
            </li>
          ))}
        </ol>
      )}

      <Popup id={formId} title={t('reviews.write')}>
        <div className="popup__body">
          <ReviewForm productId={numericId(product.id)} labels={labels} />
        </div>
      </Popup>
    </section>
  );
}
