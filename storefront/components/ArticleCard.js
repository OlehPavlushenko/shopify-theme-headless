// Article card: theme/snippets/article-card.liquid — image, date · reading time, title, excerpt, "Read more"
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

const formatDate = (iso) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso));

export default function ArticleCard({ article, blogHandle, showDate = true, showExcerpt = true, sizes, headingTag: Heading = 'h3' }) {
  // snippets/reading-time: words / 200, at least 1
  const minutes = Math.max(1, Math.floor(article.content.split(' ').length / 200));
  const excerpt = (article.excerpt || article.content).split(/\s+/).slice(0, 30).join(' ');
  return (
    <article className="article-card">
      <div className="frame article-card__media" style={{ '--frame-ratio': '3 / 2' }}>
        {article.image && (
          <Image
            src={article.image.url}
            alt={article.image.altText || ''}
            width={article.image.width}
            height={article.image.height}
            sizes={sizes}
          />
        )}
      </div>
      <div className="article-card__body">
        {showDate && (
          <span className="article-card__date">
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> · {t('blog.reading_time', { count: minutes })}
          </span>
        )}
        <Heading className="h5 article-card__title">
          <Link href={`/blogs/${blogHandle}/${article.handle}`} className="article-card__link">
            {article.title}
          </Link>
        </Heading>
        {showExcerpt && <p className="article-card__excerpt line-clamp">{excerpt}</p>}
        <span className="link-arrow article-card__more" aria-hidden="true">
          {t('blog.read_more')}
          <Icon name="arrow-right" />
        </span>
      </div>
    </article>
  );
}
