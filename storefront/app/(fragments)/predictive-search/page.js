// The search panel's results for ?q= — the markup of theme/sections/predictive-search.liquid in one
// answer (suggestions and collections in the aside, products in a slider, "View all"), read by
// @ui/predictive-search from [data-predictive-results]
import Icon from '@/components/Icon.js';
import ProductCard from '@/components/ProductCard.js';
import SliderNav from '@/components/SliderNav.js';
import { predictiveSearch } from '@/lib/queries.js';
import { t } from '@/lib/theme.js';

export default async function PredictiveSearch({ searchParams }) {
  const query = String((await searchParams).q ?? '').trim();
  if (!query) return <div data-predictive-results />;
  const { queries, collections, products } = await predictiveSearch(query);
  const searchUrl = (terms) => `/search?q=${encodeURIComponent(terms)}`;

  return (
    <div data-predictive-results>
      <div className="search-results__layout">
        <div className="search-results__aside">
          {queries.length > 0 && (
            <section className="search-results__group" aria-labelledby="PredictiveQueries">
              <h2 id="PredictiveQueries" className="eyebrow search-results__heading">
                {t('search.suggestions')}
              </h2>
              <ul className="link-list" role="list">
                {queries.slice(0, 5).map((item) => (
                  <li key={item.text}>
                    <a href={searchUrl(item.text)} className="link-list__link">
                      <Icon name="search" />
                      <span className="link-list__text" dangerouslySetInnerHTML={{ __html: item.styledText }} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {collections.length > 0 && (
            <section className="search-results__group" aria-labelledby="PredictiveCollections">
              <h2 id="PredictiveCollections" className="eyebrow search-results__heading">
                {t('search.collections')}
              </h2>
              <ul className="link-list" role="list">
                {collections.slice(0, 5).map((collection) => (
                  <li key={collection.handle}>
                    <a href={`/collections/${collection.handle}`} className="link-list__link">
                      <span className="link-list__text">{collection.title}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        {products.length > 0 ? (
          <ui-slider class="slider search-slider search-results__main" aria-labelledby="PredictiveProducts">
            <div className="slider__head">
              <h2 id="PredictiveProducts" className="eyebrow search-results__heading">
                {t('search.products')}
              </h2>
              <div className="slider__head-end">
                <SliderNav label={t('search.products')} />
              </div>
            </div>
            <ul className="scroll-track slider__track" data-slider-track role="list">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard
                    product={product}
                    headingTag="p"
                    actions={false}
                    secondImage={false}
                    sizes="(min-width: 1280px) 260px, (min-width: 750px) 30vw, 45vw"
                  />
                </li>
              ))}
            </ul>
          </ui-slider>
        ) : (
          <div className="search-results__main">
            <p
              className="search-results__empty"
              dangerouslySetInnerHTML={{ __html: t('search.no_results_html', { terms: escapeHtml(query) }) }}
            />
          </div>
        )}
      </div>
      {products.length > 0 && (
        <div className="search-results__footer">
          <a href={searchUrl(query)} className="btn btn--outline btn--sm">
            <span dangerouslySetInnerHTML={{ __html: t('search.view_all_html', { terms: escapeHtml(query) }) }} />
            <Icon name="arrow-right" />
          </a>
        </div>
      )}
    </div>
  );
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
