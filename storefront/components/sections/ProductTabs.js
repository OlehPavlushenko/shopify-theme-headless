// theme/sections/product-tabs.liquid: the product page's content as tabs (<ui-tabs>, @ui/tabs) — the
// description, texts (a text without text is left out), and of the app blocks Judge.me's review widget
// (components/ProductReviews.js) under the section's "App tab title"; other app blocks are left out
import ProductReviews from '../ProductReviews.js';

const isReviewWidget = (block) => block.type.includes('/judge-me-reviews/blocks/review_widget/');

export default function ProductTabs({ section, context = {} }) {
  const { settings, blocks } = section;
  const { product } = context;
  if (!product) return null;
  const tabs = blocks
    .map((block) => {
      if (block.type === 'description') {
        return product.descriptionHtml && { block, title: block.settings.title, html: product.descriptionHtml };
      }
      if (block.type === 'text') return block.settings.content && { block, title: block.settings.title, html: block.settings.content };
      return isReviewWidget(block) && { block, title: settings.app_title, reviews: true };
    })
    .filter(Boolean);
  if (!tabs.length) return null;
  const id = (kind, index) => `${kind}-${section.id}-${index + 1}`;
  return (
    <div className={`product-tabs color-${settings.color_scheme} section-spacing`}>
      <ui-tabs class="page-width product-tabs__inner">
        <div className="product-tabs__list scrollbar-hidden" role="tablist" aria-label={product.title}>
          {tabs.map((tab, index) => (
            <button
              key={tab.block.id}
              type="button"
              className="product-tabs__tab"
              role="tab"
              id={id('Tab', index)}
              aria-controls={id('TabPanel', index)}
              aria-selected={index === 0 ? 'true' : 'false'}
              tabIndex={index === 0 ? undefined : -1}
            >
              {tab.title}
            </button>
          ))}
        </div>
        {tabs.map((tab, index) => (
          <div
            key={tab.block.id}
            className="product-tabs__panel"
            role="tabpanel"
            id={id('TabPanel', index)}
            aria-labelledby={id('Tab', index)}
            tabIndex={0}
            hidden={index > 0}
          >
            {tab.reviews ? <ProductReviews product={product} /> : <div className="rte" dangerouslySetInnerHTML={{ __html: tab.html }} />}
          </div>
        ))}
      </ui-tabs>
    </div>
  );
}
