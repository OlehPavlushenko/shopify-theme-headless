// Search panel: theme/snippets/search-panel.liquid — a <dialog id="SearchPanel"> (top sheet or drawer,
// the header's settings) with <predictive-search> asking app/(fragments)/predictive-search for results.
// While the query is empty it shows the header's search blocks: popular searches, quick links,
// collections (left) and product sliders (right).
import Link from 'next/link';
import CloseButton from './CloseButton.js';
import Icon from './Icon.js';
import ProductCard from './ProductCard.js';
import SliderNav from './SliderNav.js';
import { getCollection, getCollectionsByHandles, getProductsByHandles } from '@/lib/queries.js';
import { linkUrl } from '@/lib/links.js';
import { t } from '@/lib/theme.js';

// Consecutive blocks of one type form one list (search_term, search_link)
function groups(blocks) {
  const result = [];
  for (const block of blocks) {
    const last = result.at(-1);
    if (last && last.type === block.type && (block.type === 'search_term' || block.type === 'search_link')) last.blocks.push(block);
    else result.push({ type: block.type, blocks: [block] });
  }
  return result;
}

async function ProductsBlock({ block, sizes }) {
  const s = block.settings;
  const products = s.products?.length
    ? await getProductsByHandles(s.products)
    : ((await getCollection(s.collection))?.products.nodes ?? []);
  if (!products.length) return null;
  return (
    <ui-slider class="slider search-slider">
      <div className="slider__head">
        <h2 className="eyebrow search-results__heading">{s.heading}</h2>
        <div className="slider__head-end">
          <SliderNav label={s.heading} />
        </div>
      </div>
      <ul className="scroll-track slider__track" data-slider-track role="list">
        {products.slice(0, s.limit).map((product) => (
          <li key={product.id}>
            <ProductCard product={product} headingTag="p" secondImage={false} sizes={sizes} />
          </li>
        ))}
      </ul>
    </ui-slider>
  );
}

async function CollectionsBlock({ block }) {
  const collections = await getCollectionsByHandles(block.settings.collections ?? []);
  if (!collections.length) return null;
  return (
    <section className="search-results__group">
      {block.settings.heading && <h2 className="eyebrow search-results__heading">{block.settings.heading}</h2>}
      <ul className="link-list" role="list">
        {collections.map((collection) => (
          <li key={collection.handle}>
            <Link href={`/collections/${collection.handle}`} className="link-list__link">
              <span className="link-list__text">{collection.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SearchPanel({ header }) {
  const { settings, blocks } = header;
  const style = settings.search_style || 'top';
  const sizes = style === 'drawer' ? '(min-width: 750px) 180px, 45vw' : '(min-width: 1280px) 260px, (min-width: 750px) 30vw, 45vw';
  const searchBlocks = blocks.filter((block) => block.type.startsWith('search_'));

  return (
    <dialog
      id="SearchPanel"
      className={`drawer${style === 'top' ? ' drawer--top' : ''} search-panel search-panel--${style} color-${settings.search_color_scheme}`}
      aria-label={t('search.title')}
    >
      <predictive-search
        class={`search-panel__inner${style === 'top' ? ' page-width' : ''}`}
        data-endpoint="/predictive-search"
        data-params=""
      >
        <form-validate data-message-required={t('search.empty_query')}>
          <form action="/search" method="get" role="search" className="search-panel__form">
            <label className="visually-hidden" htmlFor="SearchPanel-input">
              {t('search.title')}
            </label>
            <Icon name="search" className="search-panel__icon" />
            <input
              id="SearchPanel-input"
              className="search-panel__input"
              type="search"
              name="q"
              placeholder={t('search.placeholder')}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              aria-controls="SearchPanel-results"
              enterKeyHint="search"
              required
            />
            <CloseButton />
          </form>
        </form-validate>
        <div id="SearchPanel-results" className="search-panel__results" data-results aria-live="polite" />
        <div className="search-panel__empty" data-empty-state>
          <div className="search-results__layout">
            <div className="search-results__aside">
              {groups(searchBlocks).map((group) => {
                const key = group.blocks[0].id;
                if (group.type === 'search_term' || group.type === 'search_link') {
                  const terms = group.type === 'search_term';
                  return (
                    <section key={key} className="search-results__group">
                      <h2 className="eyebrow search-results__heading">{t(terms ? 'search.popular' : 'search.quick_links')}</h2>
                      <ul className="link-list" role="list">
                        {group.blocks.map((block) => (
                          <li key={block.id}>
                            <a
                              href={terms ? `/search?q=${encodeURIComponent(block.settings.term)}` : linkUrl(block.settings.link) || '/'}
                              className="link-list__link"
                            >
                              {terms && <Icon name="search" />}
                              <span className="link-list__text">{terms ? block.settings.term : block.settings.title}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    </section>
                  );
                }
                return group.type === 'search_collections' ? <CollectionsBlock key={key} block={group.blocks[0]} /> : null;
              })}
            </div>
            <div className="search-results__main">
              {searchBlocks
                .filter((block) => block.type === 'search_products')
                .map((block) => (
                  <ProductsBlock key={block.id} block={block} sizes={sizes} />
                ))}
            </div>
          </div>
        </div>
      </predictive-search>
    </dialog>
  );
}
