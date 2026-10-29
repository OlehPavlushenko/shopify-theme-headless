// theme/sections/apps.liquid: app blocks in the page width on the section's color scheme. Apps draw their
// own content in the theme; here only what has a counterpart — Judge.me's review widget on a product page
// (components/ProductReviews.js). Other app blocks are left out.
import ProductReviews from '../ProductReviews.js';

const isReviewWidget = (block) => block.type.includes('/judge-me-reviews/blocks/review_widget/');

export default function Apps({ section, context = {} }) {
  const { settings, blocks } = section;
  const reviews = context.product && blocks.some(isReviewWidget);
  if (!reviews) return null;
  return (
    <div className={`apps color-${settings.color_scheme} section-spacing`}>
      <div className={settings.full_width ? undefined : 'page-width'}>
        <ProductReviews product={context.product} />
      </div>
    </div>
  );
}
