// theme/sections/main-article.liquid: breadcrumbs, topic tags, the title, author · date · reading time,
// the cover, a table of contents (<article-toc>, @ui/article-toc) and the article's products
// (metafield theme.products) beside the text, share links, the way back to the blog and "Read next"
// (the most shared tags first). Comments are left out: the Storefront API has no comment form.
// context: lib/blog.js getArticlePage.
import Image from 'next/image';
import Link from 'next/link';
import ArticleCard, { formatDate, readingTime } from '../ArticleCard.js';
import Breadcrumbs from '../Breadcrumbs.js';
import Icon from '../Icon.js';
import ProductRow from '../ProductRow.js';
import SectionHead from '../SectionHead.js';
import { topicUrl } from '@/lib/blog.js';
import { t } from '@/lib/theme.js';

function Share({ url, title }) {
  const links = [
    ['facebook', 'Facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
    ['telegram', 'Telegram', `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`],
    [
      'pinterest',
      'Pinterest',
      `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(title)}`,
    ],
  ];
  return (
    <div className="main-article__share">
      <span className="main-article__share-label">{t('blog.share')}</span>
      {links.map(([icon, label, href]) => (
        <a key={icon} className="btn btn--icon btn--outline" href={href} target="_blank" rel="noopener" aria-label={label}>
          <Icon name={icon} />
        </a>
      ))}
    </div>
  );
}

export default function MainArticle({ section, context = {} }) {
  const { settings } = section;
  const { article, blog, related = [] } = context;
  if (!article) return null;
  const shareUrl = `${process.env.SITE_URL || ''}${blog.url}/${article.handle}`;
  const author = article.authorV2?.name;
  const products = settings.show_products ? article.products.slice(0, 6) : [];
  return (
    <article className={`main-article color-${settings.color_scheme} section-spacing`}>
      {settings.show_toc && <span className="reading-progress" data-reading-progress="" aria-hidden="true" />}
      <header className="page-width page-width--narrow main-article__header">
        <Breadcrumbs trail={[{ title: blog.title, url: blog.url }]} current={article.title} />
        {article.tags.length > 0 && (
          <ul className="main-article__tags" role="list">
            {article.tags.map((tag) => (
              <li key={tag}>
                <a href={topicUrl(blog.url, [], tag)} className="tag">
                  {tag}
                </a>
              </li>
            ))}
          </ul>
        )}
        <h1 className="h1 main-article__title">{article.title}</h1>
        <p className="main-article__meta">
          {settings.show_author && author && <span>{t('blog.by', { author })}</span>}
          <span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </span>
          {settings.show_reading_time && <span>{t('blog.reading_time', { count: readingTime(article) })}</span>}
        </p>
      </header>

      {article.image && settings.image_layout !== 'none' && (
        <div className="page-width main-article__media">
          <div className="frame" style={{ '--frame-ratio': '16 / 9' }}>
            <Image
              src={article.image.url}
              alt={article.image.altText || ''}
              width={article.image.width}
              height={article.image.height}
              sizes="(min-width: 1440px) 1344px, 100vw"
              priority
            />
          </div>
        </div>
      )}

      <div className="page-width main-article__layout">
        {settings.show_toc && (
          <aside className="main-article__toc sticky-column sticky-column--scroll sticky-column--wide">
            {/* From 1200px a sticky list; below it a bar at the bottom of the screen that opens the list */}
            <article-toc class="article-toc" data-content={`#ArticleContent-${section.id}`} hidden>
              <button
                type="button"
                className="article-toc__toggle"
                aria-expanded="false"
                aria-controls={`ArticleTocPanel-${section.id}`}
                data-toc-toggle=""
              >
                <span className="article-toc__toggle-text">
                  <span className="article-toc__toggle-label">{t('blog.on_this_page')}</span>
                  <span className="article-toc__toggle-current" data-toc-current="" />
                </span>
                <Icon name="chevron-down" />
              </button>
              <div className="article-toc__panel" id={`ArticleTocPanel-${section.id}`} data-toc-panel="">
                <p className="article-toc__title">{t('blog.on_this_page')}</p>
                <ol className="article-toc__list" role="list" data-toc-list="" />
              </div>
            </article-toc>
          </aside>
        )}

        {products.length > 0 && (
          <aside
            className="main-article__shop card sticky-column sticky-column--scroll sticky-column--wide"
            aria-labelledby={`ShopArticle-${section.id}`}
          >
            <h2 id={`ShopArticle-${section.id}`} className="h5">
              {t('blog.shop_article')}
            </h2>
            <ul className="product-rows" role="list">
              {products.map((product) => (
                <ProductRow key={product.id} product={product} />
              ))}
            </ul>
          </aside>
        )}

        <div className="main-article__body">
          <div
            className="rte main-article__content"
            id={`ArticleContent-${section.id}`}
            dangerouslySetInnerHTML={{ __html: article.contentHtml }}
          />
          {settings.show_share && <Share url={shareUrl} title={article.title} />}
          <Link href={blog.url} className="link-arrow main-article__back">
            <Icon name="arrow-left" />
            {t('blog.back', { blog: blog.title })}
          </Link>
        </div>
      </div>

      {settings.show_related && related.length > 0 && (
        <section className="page-width main-article__related" aria-labelledby={`ReadNext-${section.id}`}>
          <SectionHead heading={t('blog.read_next')} id={`ReadNext-${section.id}`} linkLabel={t('blog.all_articles')} link={blog.url} />
          <ul className="grid main-article__related-grid" role="list" style={{ '--grid-columns': 3, '--grid-columns-mobile': 1 }}>
            {related.map((item) => (
              <li key={item.handle}>
                <ArticleCard article={item} showExcerpt={false} sizes="(min-width: 990px) 33vw, (min-width: 750px) 50vw, 100vw" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
