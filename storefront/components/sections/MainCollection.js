// theme/sections/main-collection.liquid with snippets/facets-page, facets and facets-active: the toolbar
// (filters button, count, sort, grid density), active filter chips, the filters panel (sidebar /
// dropdowns / drawer; a drawer on phones) and the grid with the promo tile, then "Load more". The same
// markup and the shared modules: <facet-filters> (@ui/facets) and <load-more> (@ui/load-more) fetch this
// section on its own from app/(fragments)/collection-section/<handle> (data-endpoint) with the page's query.
// context.listing: lib/collection.js getCollectionPage, or getSearchPage on the search page (the terms
// ride along in the filter form; before a search a prompt; a search that finds nothing, unfiltered, shows
// only its message), fetched from app/(fragments)/search-section.
import ChipRemove from '../ChipRemove.js';
import DialogHeader from '../DialogHeader.js';
import Icon from '../Icon.js';
import LoadMoreCell from '../LoadMoreCell.js';
import ProductCard from '../ProductCard.js';
import PromoCard, { promoCardProps } from '../PromoCard.js';
import { SearchOptions } from '../SearchForm.js';
import Swatch, { isColorOption } from '../Swatch.js';
import { formatMoney } from '@/lib/format.js';
import { escapeHtml } from '@/lib/text.js';
import { getSettings, t } from '@/lib/theme.js';

const SHOWN_VALUES = 6;

// A price range end in the store currency, whole amounts without cents ("$40", "$12.50")
const rangeMoney = (amount, currency) => formatMoney({ amount, currencyCode: currency }).replace(/\.00$/, '');

// One end of the price range: the store currency's symbol and a number field (<price-range>, @ui/facets)
function PriceField({ label, symbol, field, max, placeholder, end }) {
  return (
    <label className="facet__price-field">
      <span className="visually-hidden">{label}</span>
      <span className="facet__price-symbol" aria-hidden="true">
        {symbol}
      </span>
      <input
        className="input"
        type="number"
        inputMode="numeric"
        name={field.param}
        defaultValue={field.value || undefined}
        placeholder={placeholder}
        min="0"
        max={Math.ceil(max)}
        data-price-min={end === 'min' ? '' : undefined}
        data-price-max={end === 'max' ? '' : undefined}
      />
    </label>
  );
}

// snippets/facets-active: removable chips and "Clear all"
function ActiveChips({ filters, clearUrl, currency }) {
  const chips = [];
  for (const filter of filters) {
    if (filter.type === 'price_range') {
      if (!filter.min.value && !filter.max.value) continue;
      const label = `${rangeMoney(filter.min.value || 0, currency)}–${rangeMoney(filter.max.value || filter.rangeMax, currency)}`;
      chips.push({ key: filter.id, url: filter.urlToRemove, label, ariaLabel: t('facets.remove', { filter: label }) });
      continue;
    }
    for (const value of filter.values.filter((item) => item.active)) {
      chips.push({
        key: `${filter.id}.${value.value}`,
        url: value.urlToRemove,
        label: (
          <>
            {isColorOption(filter) && <Swatch value={value} className="facets-active__swatch" />}
            {value.label}
          </>
        ),
        ariaLabel: t('facets.remove', { filter: value.label }),
      });
    }
  }
  if (!chips.length) return null;
  return (
    <ul className="facets-active" role="list">
      {chips.map((chip) => (
        <ChipRemove key={chip.key} url={chip.url} label={chip.label} ariaLabel={chip.ariaLabel} linkAttr="data-facets-link" />
      ))}
      <li>
        <a href={clearUrl} className="btn btn--link facets-active__clear" data-facets-link="">
          {t('facets.clear_all')}
        </a>
      </li>
    </ul>
  );
}

// snippets/facets: the filter form
function FilterForm({ filters, formId, layout, sortBy, currency, terms }) {
  const symbol = new Intl.NumberFormat('en-US', { style: 'currency', currency })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value;
  const groups = filters.filter((filter) =>
    filter.type === 'price_range' ? filter.rangeMax > 0 : filter.values.some((value) => value.count > 0 || value.active)
  );
  return (
    <form id={formId} className="facets__form" data-facets-form="">
      {terms && (
        <>
          <input type="hidden" name="q" value={terms} />
          <SearchOptions />
        </>
      )}
      {groups.map((filter, index) => {
        const activeCount =
          filter.type === 'price_range'
            ? filter.min.value || filter.max.value
              ? 1
              : 0
            : filter.values.filter((value) => value.active).length;
        const open = layout !== 'horizontal' && ((layout === 'sidebar' && index < 4) || activeCount > 0);
        const key = filter.id.replace(/[^a-z0-9]+/gi, '-');
        return (
          <details key={filter.id} className={`facet facet--${filter.type}`} data-facet={key} open={open}>
            <summary className="facet__summary">
              <span className="facet__label">{filter.label}</span>
              {activeCount > 0 && <span className="count-badge count-badge--sm facet__badge">{activeCount}</span>}
              <Icon name="chevron-down" />
            </summary>
            <div className="facet__body">
              {filter.type === 'price_range' ? (
                <>
                  <p className="facet__hint">{t('facets.highest_price', { price: rangeMoney(filter.rangeMax, currency) })}</p>
                  <price-range class="facet__price" data-max={Math.ceil(filter.rangeMax)}>
                    <div className="facet__price-fields">
                      <PriceField
                        label={t('facets.from')}
                        symbol={symbol}
                        field={filter.min}
                        max={filter.rangeMax}
                        placeholder="0"
                        end="min"
                      />
                      <span className="facet__price-dash" aria-hidden="true">
                        –
                      </span>
                      <PriceField
                        label={t('facets.to')}
                        symbol={symbol}
                        field={filter.max}
                        max={filter.rangeMax}
                        placeholder={String(Math.ceil(filter.rangeMax))}
                        end="max"
                      />
                    </div>
                    <div className="facet__range" aria-hidden="true">
                      <input
                        type="range"
                        min="0"
                        max={Math.ceil(filter.rangeMax)}
                        step="1"
                        defaultValue={filter.min.value || 0}
                        tabIndex={-1}
                        data-range-min=""
                      />
                      <input
                        type="range"
                        min="0"
                        max={Math.ceil(filter.rangeMax)}
                        step="1"
                        defaultValue={filter.max.value || Math.ceil(filter.rangeMax)}
                        tabIndex={-1}
                        data-range-max=""
                      />
                    </div>
                  </price-range>
                </>
              ) : (
                <>
                  <ul className="facet__values" role="list">
                    {filter.values.map((value, i) => {
                      const disabled = value.count === 0 && !value.active;
                      return (
                        <li
                          key={value.value}
                          className="facet__item"
                          data-facet-more={i >= SHOWN_VALUES ? '' : undefined}
                          hidden={i >= SHOWN_VALUES}
                        >
                          <label className={`facet__value${disabled ? ' facet__value--disabled' : ''}`}>
                            <input
                              type="checkbox"
                              className="facet__checkbox"
                              name={value.param}
                              value={value.value}
                              defaultChecked={value.active}
                              disabled={disabled}
                            />
                            {isColorOption(filter) ? (
                              <Swatch value={value} className="facet__swatch" />
                            ) : (
                              <span className="facet__check" aria-hidden="true">
                                <Icon name="check" />
                              </span>
                            )}
                            <span className="facet__value-label">{value.label}</span>
                            <span className="facet__count">{value.count}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                  {filter.values.length > SHOWN_VALUES && (
                    <button
                      type="button"
                      className="btn btn--link facet__more"
                      data-facet-more-toggle=""
                      data-label-less={t('facets.show_less')}
                    >
                      {t('facets.show_more', { count: filter.values.length - SHOWN_VALUES })}
                    </button>
                  )}
                </>
              )}
            </div>
          </details>
        );
      })}
      {sortBy && <input type="hidden" name="sort_by" value={sortBy} data-facets-sort-fallback="" />}
      <noscript>
        <button type="submit" className="btn btn--full">
          {t('facets.apply')}
        </button>
      </noscript>
    </form>
  );
}

export default function MainCollection({ section, context = {} }) {
  const { settings, blocks } = section;
  const listing = context.listing;
  if (!listing) return null;
  if (listing.performed === false) {
    return (
      <div className={`main-collection color-${settings.color_scheme} section-spacing`}>
        <div className="page-width">
          <div className="empty-state">
            <Icon name="search" />
            <p className="h5">{t('search.start_title')}</p>
            <p>{t('search.start_text')}</p>
          </div>
        </div>
      </div>
    );
  }
  const { filters, products, sortBy, sortOptions, activeCount, count, shown, nextUrl, clearUrl, page, terms } = listing;
  const handle = listing.collection.handle;
  const currency = products[0]?.priceRange.minVariantPrice.currencyCode ?? 'USD';
  const layout = settings.filters_layout;
  const formId = `FacetsForm-${section.id}`;
  const panelId = `FacetsPanel-${section.id}`;
  // A search with no results and no filter on: only its message (nothing to filter or sort)
  const bare = Boolean(terms) && count === 0 && activeCount === 0;
  const hasFilters = settings.show_filters && filters.length > 0 && !bare;
  const columns = settings.columns_desktop;
  const fewColumns = Math.max(2, columns - 1);
  const tabletColumns = Math.min(3, columns);
  const fewTabletColumns = Math.max(2, tabletColumns - 1);
  const tabletSize = `${Math.floor(100 / tabletColumns)}vw`;
  const sizes =
    hasFilters && layout === 'sidebar'
      ? `(min-width: 1200px) calc((100vw - 36rem) / ${columns}), (min-width: 990px) calc((100vw - 36rem) / ${tabletColumns}), (min-width: 750px) ${tabletSize}, 50vw`
      : `(min-width: 990px) calc((100vw - 10rem) / ${columns}), (min-width: 750px) ${tabletSize}, 50vw`;
  const promo = terms ? null : blocks.find((block) => block.type === 'promo');
  const countLabel = terms ? t('search.results_count', { count }) : t('collections.product_count', { count });
  const endpoint = terms ? '/search-section' : `/collection-section/${handle}`;
  const theme = getSettings();

  return (
    <facet-filters
      class={`main-collection facets facets--${layout}${hasFilters ? '' : ' facets--none'} color-${settings.color_scheme} section-spacing`}
      data-section={section.id}
      data-endpoint={endpoint}
    >
      <div className="page-width">
        {!bare && (
          <div className="facets__toolbar">
            {hasFilters && (
              <button type="button" className="btn btn--outline btn--sm facets__toggle" popoverTarget={panelId}>
                <Icon name="sliders" />
                {t('facets.filters')}
                <span className="count-badge facets__toggle-count" data-facets-active-count="" hidden={activeCount === 0}>
                  {activeCount}
                </span>
              </button>
            )}
            <p className="facets__count" data-facets-count="" role="status">
              {countLabel}
            </p>
            <div className="facets__tools">
              {settings.show_sort && (
                <label className="facets__sort">
                  <span className="facets__sort-label">{t('facets.sort_by')}</span>
                  <select name="sort_by" className="facets__sort-select" form={formId} data-facets-sort="" defaultValue={sortBy}>
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <Icon name="chevron-down" />
                </label>
              )}
              {settings.show_density && (
                <div className="facets__density" role="group" aria-label={t('facets.density')}>
                  {[
                    ['few', fewColumns, fewTabletColumns, 'false'],
                    ['many', columns, tabletColumns, 'true'],
                  ].map(([density, total, tablet, pressed]) => (
                    <button
                      key={density}
                      type="button"
                      className={`facets__density-button facets__density-button--${density}`}
                      data-density={density}
                      aria-label={t(`facets.density_${density}`)}
                      aria-pressed={pressed}
                    >
                      <span className="facets__density-icon" aria-hidden="true">
                        {Array.from({ length: total }, (_, i) => (
                          <span key={i} data-wide={i + 1 > tablet ? '' : undefined} />
                        ))}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {!bare && (
          <div className="facets__active" data-facets-active="">
            {hasFilters && <ActiveChips filters={filters} clearUrl={clearUrl} currency={currency} />}
          </div>
        )}

        <div className="facets__layout">
          {hasFilters && (
            <div
              id={panelId}
              className={`facets__panel drawer drawer--start${layout === 'sidebar' ? ' sticky-column sticky-column--scroll' : ''}`}
              popover="manual"
              aria-labelledby={`${panelId}-title`}
            >
              <div className="drawer__inner facets__panel-inner">
                <DialogHeader
                  className="drawer__header facets__panel-header"
                  tag="p"
                  titleId={`${panelId}-title`}
                  titleClass="facets__panel-title"
                  title={
                    <>
                      <Icon name="sliders" />
                      {t('facets.filters')}
                    </>
                  }
                  actions={
                    <span className="facets__panel-clear" data-facets-clear="">
                      {activeCount > 0 && (
                        <a href={clearUrl} className="btn btn--link" data-facets-link="">
                          {t('facets.clear_all')}
                        </a>
                      )}
                    </span>
                  }
                  closeClass="facets__panel-close"
                  popover={panelId}
                />
                <div className="drawer__body facets__panel-body" data-facets-body="">
                  <FilterForm
                    filters={filters}
                    formId={formId}
                    layout={layout}
                    sortBy={settings.show_sort ? null : sortBy}
                    currency={currency}
                    terms={terms}
                  />
                </div>
                <div className="drawer__footer facets__panel-footer">
                  <a href={clearUrl} className="btn btn--outline" data-facets-link="">
                    {t('facets.clear_all')}
                  </a>
                  <button type="button" className="btn" popoverTarget={panelId} popoverTargetAction="hide" data-facets-show="">
                    {t('facets.show_results', { count })}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="facets__results" data-facets-results="">
            {products.length > 0 ? (
              <>
                <h2 className="visually-hidden">{t('facets.products_heading')}</h2>
                <load-more data-section={section.id} data-endpoint={endpoint}>
                  <ul
                    id={`ProductGrid-${section.id}`}
                    className="grid facets__grid"
                    role="list"
                    style={{
                      '--cols': columns,
                      '--cols-few': fewColumns,
                      '--cols-tablet': tabletColumns,
                      '--cols-few-tablet': fewTabletColumns,
                      '--cols-mobile': settings.columns_mobile,
                    }}
                    data-facets-grid=""
                    data-load-more-grid=""
                  >
                    {products.map((product, index) => (
                      <ItemWithPromo key={product.id} index={index} promo={page === 1 ? promo : null} sizes={sizes}>
                        <li data-load-more-item="">
                          <ProductCard
                            product={product}
                            eager={page === 1 && index < columns}
                            sizes={sizes}
                            quickAdd={settings.quick_add}
                            showVendor={settings.show_vendor || theme.card_show_vendor}
                          />
                        </li>
                      </ItemWithPromo>
                    ))}
                    {settings.pagination === 'load_more' && <LoadMoreCell nextUrl={nextUrl} shown={shown} total={count} />}
                  </ul>
                </load-more>
              </>
            ) : (
              <div className="empty-state">
                <Icon name="search" />
                {activeCount > 0 ? (
                  <>
                    <p className="h5">{t('facets.no_results')}</p>
                    <p>{t('facets.no_results_text')}</p>
                    <a href={clearUrl} className="btn" data-facets-link="">
                      {t('facets.clear_all')}
                    </a>
                  </>
                ) : terms ? (
                  <>
                    <p className="h5" dangerouslySetInnerHTML={{ __html: t('search.no_results_html', { terms: escapeHtml(terms) }) }} />
                    <a href="/collections/all" className="btn">
                      {t('search.browse_all')}
                    </a>
                  </>
                ) : (
                  <>
                    <p className="h5">{t('collections.empty')}</p>
                    <a href="/collections/all" className="btn">
                      {t('cart.continue_shopping')}
                    </a>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </facet-filters>
  );
}

// The promo tile (a "Promo" block) at its position on the first page, before that product
function ItemWithPromo({ index, promo, sizes, children }) {
  if (!promo || index + 1 !== Number(promo.settings.position)) return children;
  return (
    <>
      <li className="facets__promo grid-promo">
        <PromoCard {...promoCardProps(promo.settings)} layout="overlay" ratio="4 / 5" sizes={sizes} />
      </li>
      {children}
    </>
  );
}
