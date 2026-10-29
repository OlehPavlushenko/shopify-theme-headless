// Article card: theme/snippets/article-card.liquid — image, date · reading time, title (its link covers the
// card), excerpt, up to three topic tags (each toggles its topic in the blog filter: data-section-link for
// <section-swap>; a chosen one is marked) and "Read more"
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import { topicUrl, handleize } from '@/lib/blog.js';
import { formatDate, truncateWords } from '@/lib/text.js';
import { t } from '@/lib/theme.js';

// snippets/reading-time: words / 200, at least 1
export const readingTime = (article) => Math.max(1, Math.floor(article.content.split(' ').length / 200));

export default function ArticleCard({
  article,
  showDate = true,
  showExcerpt = true,
  showTags = false,
  chosen = [],
  layout,
  eager = false,
  sizes,
  headingTag: Heading = 'h3',
}) {
  const blogUrl = `/blogs/${article.blog.handle}`;
  const featured = layout === 'featured';
  return (
    <article className={`article-card${featured ? ' article-card--featured' : ''}`}>
      <div className="frame article-card__media" style={{ '--frame-ratio': '3 / 2' }}>
        {article.image && (
          <Image
            src={article.image.url}
            alt={article.image.altText || ''}
            width={article.image.width}
            height={article.image.height}
            sizes={sizes}
            priority={eager}
          />
        )}
      </div>
      <div className="article-card__body">
        {showDate && (
          <span className="article-card__date">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> ·{' '}
            {t('blog.reading_time', { count: readingTime(article) })}
          </span>
        )}
        <Heading className={`${featured ? 'h3' : 'h5'} article-card__title`}>
          <Link href={`${blogUrl}/${article.handle}`} className="article-card__link">
            {article.title}
          </Link>
        </Heading>
        {showExcerpt && <p className="article-card__excerpt line-clamp">{truncateWords(article.excerpt || article.content, 30)}</p>}
        {showTags && article.tags.length > 0 && (
          <ul className="article-card__tags" role="list">
            {article.tags.slice(0, 3).map((tag) => (
              <li key={tag}>
                <a
                  href={topicUrl(blogUrl, chosen, tag)}
                  className="tag"
                  data-section-link=""
                  aria-current={chosen.includes(handleize(tag)) ? 'true' : undefined}
                >
                  {tag}
                </a>
              </li>
            ))}
          </ul>
        )}
        <span className="link-arrow article-card__more" aria-hidden="true">
          {t('blog.read_more')}
          <Icon name="arrow-right" />
        </span>
      </div>
    </article>
  );
}
