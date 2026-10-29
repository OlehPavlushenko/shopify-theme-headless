// theme/sections/product-list.liquid: products picked by hand, from a collection or the whole catalog, as
// a slider or a grid ("Show more" on phones after 4); optional deal of the week first, with its timer
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

export default async function ProductList({ section }) {
  const { settings } = section;
  const dealActive = settings.deal_product && !(settings.deal_end && toTime(settings.deal_end) <= Date.now());
  const [list, [deal]] = await Promise.all([productsOf(settings), dealActive ? getProductsByHandles([settings.deal_product]) : []]);
  const slider = settings.layout === 'slider';
  const link = linkUrl(settings.link) || (settings.collection ? `/collections/${settings.collection}` : null);
  const sizes = `(min-width: 990px) calc((100vw - 10rem) / ${settings.columns}), (min-width: 750px) 33vw, 50vw`;
  const products = list.filter((product) => product.id !== deal?.id).slice(0, settings.limit - (deal ? 1 : 0));
  const total = products.length + (deal ? 1 : 0);

  const dealCard = deal && (
    <div className="deal-card">
      <p className="deal-card__label">{settings.deal_label}</p>
      <div className="deal-card__body">
        <ProductCard product={deal} sizes="(min-width: 750px) 25vw, 40vw" />
      </div>
      {settings.deal_end && (
        <div className="deal-card__timer" data-countdown-section>
          <Countdown end={settings.deal_end} label={false} />
        </div>
      )}
    </div>
  );
  const cards = products.map((product, index) => (
    <li key={product.id} data-more={!slider && index + (deal ? 1 : 0) >= 4 ? '' : undefined}>
      <ProductCard product={product} sizes={sizes} />
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
                <ul className="scroll-track slider__track" data-slider-track role="list">
                  {cards}
                </ul>
              </div>
            ) : (
              <ul className="scroll-track slider__track" data-slider-track role="list">
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
                <button type="button" className="btn btn--outline product-list__more-button" data-show-more>
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
