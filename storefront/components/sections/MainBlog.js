// theme/sections/main-blog.liquid with snippets/blog-page: the chosen topics (or the search terms) as
// removable chips with the count, the newest article large on the first page (optional), a promo tile and
// a sign-up card among the cards, then "Load more"; an empty state. context.listing: lib/blog.js
// getBlogPage, or getArticleSearch on the blog's search results (templates/search.blog.json).
// <section-swap> (@ui/section-swap) re-renders it in place from app/(fragments)/blog-section/<path>
// (data-endpoint-base) on topic links and the blog search form; <load-more> asks that for the next page.
import ArticleCard from '../ArticleCard.js';
import Icon from '../Icon.js';
import NewsletterForm from '../NewsletterForm.js';
import PromoCard from '../PromoCard.js';
import { blogTitle, topicUrl } from '@/lib/blog.js';
import { getShell } from '@/lib/queries.js';
import { t } from '@/lib/theme.js';

const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

// snippets/chip-remove
function ChipRemove({ url, label, ariaLabel }) {
  return (
    <li>
      <a href={url} className="chip chip--compact" data-section-link="" aria-label={ariaLabel}>
        {label}
        <Icon name="close" />
      </a>
    </li>
  );
}

export default async function MainBlog({ section, context = {} }) {
  const { settings, blocks } = section;
  const listing = context.listing;
  if (!listing) return null;
  const { articles, page, count, shown, nextUrl, chosen = [], chosenNames = [], terms } = listing;
  const isSearch = terms !== undefined;
  const blogUrl = listing.blog?.url ?? '/blogs';
  const { shop } = await getShell();
  const promo = isSearch ? null : blocks.find((block) => block.type === 'promo');
  const featured = !isSearch && settings.featured && page === 1 && chosen.length === 0;
  const endpointBase = '/blog-section';
  const cardSizes = '(min-width: 990px) 33vw, (min-width: 750px) 50vw, 100vw';

  return (
    <section-swap
      class={`main-blog color-${settings.color_scheme} section-spacing`}
      data-section={section.id}
      data-section-forms=""
      data-endpoint-base={endpointBase}
      data-title={`${blogTitle(listing)} | ${shop.name}`}
      tabIndex={-1}
    >
      <load-more data-section={section.id} data-endpoint={`${endpointBase}${listing.path}`}>
        <div className="page-width">
          {isSearch && count > 0 ? (
            <div className="main-blog__active">
              <span className="main-blog__active-label">{t('blog.results_for')}</span>
              <ul className="main-blog__active-list" role="list">
                <ChipRemove url={blogUrl} label={terms} ariaLabel={t('blog.clear_search', { terms })} />
              </ul>
              <span className="main-blog__count" role="status">
                {t('blog.articles_count', { count })}
              </span>
            </div>
          ) : (
            chosen.length > 0 && (
              <div className="main-blog__active">
                <span className="main-blog__active-label">{t('blog.filtering_by')}</span>
                <ul className="main-blog__active-list" role="list">
                  {chosenNames.map((name, index) => (
                    <ChipRemove
                      key={name}
                      url={topicUrl(blogUrl, chosen, chosen[index])}
                      label={name}
                      ariaLabel={t('blog.remove_topic', { topic: name })}
                    />
                  ))}
                  <li>
                    <a href={blogUrl} className="main-blog__clear" data-section-link="">
                      {t('facets.clear_all')}
                    </a>
                  </li>
                </ul>
                <span className="main-blog__count" role="status">
                  {t('blog.articles_count', { count })}
                </span>
              </div>
            )
          )}

          {articles.length === 0 ? (
            <div className="empty-state">
              {isSearch ? (
                <>
                  <Icon name="search" />
                  <p
                    className="h5"
                    role="status"
                    dangerouslySetInnerHTML={{ __html: t('blog.search_none_html', { terms: escapeHtml(terms) }) }}
                  />
                  <a href={blogUrl} className="btn btn--outline" data-section-link="">
                    {t('blog.all_articles')}
                  </a>
                </>
              ) : chosen.length > 0 ? (
                <>
                  <p className="h5">{t('blog.no_match')}</p>
                  <a href={blogUrl} className="btn btn--outline" data-section-link="">
                    {t('facets.clear_all')}
                  </a>
                </>
              ) : (
                <p>{t('blog.empty')}</p>
              )}
            </div>
          ) : (
            <ul
              className="grid main-blog__grid"
              role="list"
              style={{ '--grid-columns': 3, '--grid-columns-mobile': 1 }}
              data-load-more-grid=""
            >
              {articles.map((article, index) => {
                const large = featured && index === 0;
                return [
                  <li key={article.handle} data-load-more-item="" className={large ? 'main-blog__featured' : undefined}>
                    <ArticleCard
                      article={article}
                      layout={large ? 'featured' : undefined}
                      eager={large}
                      headingTag="h2"
                      showTags={settings.tags}
                      chosen={chosen}
                      sizes={large ? '(min-width: 990px) 60vw, 100vw' : cardSizes}
                    />
                  </li>,
                  promo && page === 1 && index + 1 === Number(promo.settings.position) && (
                    <li key="promo" className="main-blog__promo grid-promo">
                      <PromoCard
                        url={promo.settings.button_link}
                        image={promo.settings.image}
                        eyebrow={promo.settings.eyebrow}
                        heading={promo.settings.heading}
                        text={promo.settings.text}
                        linkLabel={promo.settings.button_label}
                        layout="overlay"
                        ratio="4 / 5"
                        sizes={cardSizes}
                      />
                    </li>
                  ),
                  !isSearch && settings.show_signup && page === 1 && index + 1 === Number(settings.signup_position) && (
                    <li key="signup" className="main-blog__signup">
                      <div className="main-blog__signup-card">
                        <span className="icon-circle main-blog__signup-icon" aria-hidden="true">
                          <Icon name="mail" />
                        </span>
                        <h2 className="h4">{settings.signup_heading}</h2>
                        {settings.signup_text && <p className="main-blog__signup-text">{settings.signup_text}</p>}
                        <NewsletterForm id={section.id} buttonLabel={settings.signup_button} note={settings.signup_note} />
                      </div>
                    </li>
                  ),
                ];
              })}
              {settings.pagination === 'load_more' && nextUrl && (
                <li className="load-more" data-load-more-cell="">
                  <p className="load-more__progress">{t('facets.progress', { shown, total: count })}</p>
                  <span
                    className="load-more__bar"
                    style={{ '--progress': `${Math.floor((shown * 100) / Math.max(count, 1))}%` }}
                    aria-hidden="true"
                  />
                  <a href={nextUrl} className="btn btn--outline" data-load-more-link="">
                    {t('facets.load_more')}
                  </a>
                </li>
              )}
            </ul>
          )}
        </div>
      </load-more>
    </section-swap>
  );
}
