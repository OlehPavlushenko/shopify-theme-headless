// The wishlist and compare page bodies: theme/sections/main-wishlist.liquid and main-compare.liquid. The
// lists live in the browser (@ui/saved-list); <saved-products> (@ui/saved-pages) fetches each product from
// app/(fragments)/saved (data-endpoint) — a card, or a column of the compare table. Skeleton while
// loading, empty state when there is nothing. Styles: packages/ui/css/saved.css.
import Icon from '../Icon.js';
import { t } from '@/lib/theme.js';

function Skeleton({ layout, count, style }) {
  return (
    <div
      className={`saved-skeleton saved-skeleton--${layout}${layout === 'grid' ? ' grid' : ''}`}
      style={style}
      data-saved-skeleton=""
      aria-hidden="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="saved-skeleton__item">
          <span className="skeleton skeleton--media" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--short" />
        </div>
      ))}
    </div>
  );
}

function Empty({ icon, heading, text }) {
  return (
    <div className="empty-state saved-empty" data-saved-empty="">
      <span className="icon-circle saved-empty__icon">
        <Icon name={icon} />
      </span>
      <h2 className="h4">{heading}</h2>
      {text && <p className="saved-empty__text">{text}</p>}
      <a href="/collections/all" className="btn">
        {t('cart.continue_shopping')}
      </a>
    </div>
  );
}

export function MainWishlist({ section }) {
  const { settings } = section;
  const gridStyle = { '--grid-columns': settings.columns, '--grid-columns-mobile': 2 };
  return (
    <div className={`main-saved color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <saved-products
          class="main-saved__body"
          data-list="wishlist"
          data-section="saved-product"
          data-endpoint="/saved"
          data-state="loading"
        >
          <show-more class="product-list__more" data-step="4">
            <ul className="grid product-list__grid" role="list" style={gridStyle} data-saved-products="" />
            <button type="button" className="btn btn--outline product-list__more-button" data-show-more="" hidden>
              {t('sections.product_list.show_more')}
            </button>
          </show-more>
          <Skeleton layout="grid" count={8} style={gridStyle} />
          <Empty icon="heart" heading={settings.empty_heading} text={settings.empty_text} />
        </saved-products>
      </div>
    </div>
  );
}

const COMPARE_ROWS = [
  '',
  'compare.price',
  'compare.brand',
  'compare.type',
  'compare.availability',
  'compare.options',
  'compare.description',
  '',
];

export function MainCompare({ section }) {
  const { settings } = section;
  return (
    <div className={`main-saved color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <saved-products
          class="main-saved__body"
          data-list="compare"
          data-section="compare-column"
          data-endpoint="/saved"
          data-state="loading"
        >
          <div className="compare-table" data-saved-products="">
            <div className="compare-table__column compare-table__labels" aria-hidden="true">
              {COMPARE_ROWS.map((key, index) => (
                <div key={index} className="compare-table__cell">
                  {key && t(key)}
                </div>
              ))}
            </div>
          </div>
          <Skeleton layout="columns" count={4} />
          <Empty icon="compare" heading={settings.empty_heading} text={settings.empty_text} />
        </saved-products>
      </div>
    </div>
  );
}
