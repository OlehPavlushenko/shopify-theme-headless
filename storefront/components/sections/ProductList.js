// theme/sections/product-list.liquid: products picked by hand, from a collection or the whole catalog, as
// a slider or a grid ("Show more" on phones after 4); optional deal of the week first, with its timer;
// collection tabs (blocks "Tab", slider layout: one slider per tab, <ui-tabs>)
import Countdown from '../Countdown.js';
import ProductCard from '../ProductCard.js';
import SectionHead from '../SectionHead.js';
import { getCollection, getProductsByHandles } from '@/lib/queries.js';
import { linkUrl, toTime } from '@/lib/links.js';
import { t } from '@/lib/theme.js';

async function productsOf(settings) {
  if (settings.products?.length) return getProductsByHandles(settings.products);
  const collection = await getCollection(settings.collection || 'all');
  return collection?.products.nodes ?? [];
}

// Collection tabs: a row of chips, one slider per tab, the first one shown; a deal of the week stays in the
// first column whichever tab is shown, the sliders one column narrower
async function Tabs({ section, link, sizes, deal, dealCard }) {
  const { settings, blocks } = section;
  const tabs = blocks.filter((block) => block.type === 'tab');
  const collections = await Promise.all(tabs.map((tab) => (tab.settings.collection ? getCollection(tab.settings.collection) : null)));
  const titleOf = (index) => tabs[index].settings.title || collections[index]?.title || '';
  const id = (kind, index) => `${kind}-${section.id}-${index + 1}`;
  const panels = tabs.map((tab, index) => (
    <div key={tab.id} role="tabpanel" id={id('TabPanel', index)} aria-labelledby={id('Tab', index)} hidden={index > 0}>
      <ui-slider
        class="slider product-list__slider"
        style={{ '--slider-columns': settings.columns - (deal ? 1 : 0), '--slider-columns-mobile': 2.2 }}
      >
        <SectionHead heading={titleOf(index)} headingClass="visually-hidden" nav />
        <ul className="scroll-track slider__track" data-slider-track="" role="list">
          {(collections[index]?.products.nodes ?? [])
            .filter((product) => product.id !== deal?.id)
            .slice(0, settings.limit)
            .map((product) => (
              <li key={product.id}>
                <ProductCard product={product} quickAdd={settings.quick_add} sizes={sizes} />
              </li>
            ))}
        </ul>
      </ui-slider>
    </div>
  ));
  return (
    <ui-tabs class="product-list__tabs" style={{ '--list-columns': settings.columns }}>
      <SectionHead heading={settings.heading} linkLabel={settings.link_label} link={link} />
      <div className="product-list__tablist scrollbar-hidden" role="tablist" aria-label={settings.heading?.replace(/<[^>]*>/g, '')}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            className="chip"
            role="tab"
            id={id('Tab', index)}
            aria-controls={id('TabPanel', index)}
            aria-selected={index === 0 ? 'true' : 'false'}
            tabIndex={index === 0 ? undefined : -1}
          >
            {titleOf(index)}
          </button>
        ))}
      </div>
      {dealCard ? (
        <div className="product-list__deal-layout">
          <div className="product-list__deal">{dealCard}</div>
          <div className="product-list__panels">{panels}</div>
        </div>
      ) : (
        panels
      )}
    </ui-tabs>
  );
}

export default async function ProductList({ section, context = {} }) {
  const { settings } = section;
  // "Only when the search finds nothing": hidden on a search page with results
  if (settings.search_empty_only && context.template === 'search' && context.listing?.count > 0) return null;
  const dealActive = settings.deal_product && !(settings.deal_end && toTime(settings.deal_end) <= Date.now());
  const tabbed = settings.layout === 'slider' && section.blocks?.some((block) => block.type === 'tab');
  const [list, [deal]] = await Promise.all([
    tabbed ? [] : productsOf(settings),
    dealActive ? getProductsByHandles([settings.deal_product]) : [],
  ]);
  const slider = settings.layout === 'slider';
  const link = linkUrl(settings.link) || (settings.collection ? `/collections/${settings.collection}` : null);
  const sizes = `(min-width: 990px) calc((100vw - 10rem) / ${settings.columns}), (min-width: 750px) 33vw, 50vw`;
  const products = list.filter((product) => product.id !== deal?.id).slice(0, settings.limit - (deal ? 1 : 0));
  const total = products.length + (deal ? 1 : 0);

  const dealCard = deal && (
    <div className="deal-card">
      <p className="deal-card__label">{settings.deal_label}</p>
      <div className="deal-card__body">
        <ProductCard product={deal} quickAdd={settings.quick_add} sizes="(min-width: 750px) 25vw, 40vw" />
      </div>
      {settings.deal_end && (
        <div className="deal-card__timer" data-countdown-section="">
          <Countdown end={settings.deal_end} label={false} />
        </div>
      )}
    </div>
  );
  if (tabbed) {
    return (
      <div className={`product-list color-${settings.color_scheme} section-spacing`}>
        <div className="page-width">
          <Tabs section={section} link={link} sizes={sizes} deal={deal} dealCard={dealCard} />
        </div>
      </div>
    );
  }
  const cards = products.map((product, index) => (
    <li key={product.id} data-more={!slider && index + (deal ? 1 : 0) >= 4 ? '' : undefined}>
      <ProductCard product={product} quickAdd={settings.quick_add} sizes={sizes} />
    </li>
  ));

  return (
    <div className={`product-list color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        {slider ? (
          <ui-slider
            class={`slider product-list__slider${deal ? ' product-list__slider--deal' : ''}`}
            style={{
              '--slider-columns': settings.columns - (deal ? 1 : 0),
              '--slider-columns-mobile': 2.2,
              '--list-columns': settings.columns,
            }}
          >
            <SectionHead heading={settings.heading} linkLabel={settings.link_label} link={link} nav />
            {deal ? (
              <div className="product-list__deal-layout">
                <div className="product-list__deal">{dealCard}</div>
                <ul className="scroll-track slider__track" data-slider-track="" role="list">
                  {cards}
                </ul>
              </div>
            ) : (
              <ul className="scroll-track slider__track" data-slider-track="" role="list">
                {cards}
              </ul>
            )}
          </ui-slider>
        ) : (
          <>
            <SectionHead heading={settings.heading} linkLabel={settings.link_label} link={link} />
            <show-more class="product-list__more" data-step="4">
              <ul
                className="grid product-list__grid"
                role="list"
                style={{ '--grid-columns': settings.columns, '--grid-columns-mobile': 2 }}
              >
                {deal && <li className="product-list__deal">{dealCard}</li>}
                {cards}
              </ul>
              {total > 4 && (
                <button type="button" className="btn btn--outline product-list__more-button" data-show-more="">
                  {t('sections.product_list.show_more')}
                </button>
              )}
            </show-more>
          </>
        )}
      </div>
    </div>
  );
}
