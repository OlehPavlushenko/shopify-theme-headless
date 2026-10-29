// theme/sections/blog-posts.liquid: the latest articles of a blog as cards in a slider
import ArticleCard from '../ArticleCard.js';
import SectionHead from '../SectionHead.js';
import { getArticles } from '@/lib/queries.js';

export default async function BlogPosts({ section }) {
  const { settings } = section;
  const { handle, articles } = await getArticles(settings.blog, settings.limit);
  if (!articles.length) return null;
  return (
    <div className={`blog-posts color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <ui-slider class="slider" style={{ '--slider-columns': settings.columns, '--slider-columns-mobile': 1.2 }}>
          <SectionHead heading={settings.heading} linkLabel={settings.link_label} link={`/blogs/${handle}`} nav />
          <ul className="scroll-track slider__track" data-slider-track role="list">
            {articles.map((article) => (
              <li key={article.handle}>
                <ArticleCard
                  article={article}
                  showDate={settings.show_date}
                  showExcerpt={settings.show_excerpt}
                  sizes="(min-width: 990px) 33vw, 85vw"
                />
              </li>
            ))}
          </ul>
        </ui-slider>
      </div>
    </div>
  );
}
