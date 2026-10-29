// Placeholder of hidden UI fetched when it is first shown: theme/snippets/lazy-section.liquid — the heading
// and a link that works without JS. <lazy-section> (@ui/lazy-section) asks app/(fragments)/lazy for the full
// element (data-lazy-key = lazyKey) and swaps it in: product sliders of the mega menu, the search panel and
// promo popups stay out of every page's HTML until opened.
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

export default function LazySection({
  part,
  sectionId,
  lazyKey,
  className,
  heading,
  headingTag: Heading = 'p',
  headingClass = 'eyebrow',
  prefetch,
  link,
}) {
  const query = new URLSearchParams({ part, section: sectionId, key: lazyKey });
  return (
    <lazy-section class={className} data-endpoint={`/lazy?${query}`} data-key={lazyKey} data-prefetch={prefetch}>
      {heading && (
        <div className="slider__head">
          <Heading className={headingClass}>{heading}</Heading>
        </div>
      )}
      <a href={link || '/collections/all'} className="link-arrow">
        {t('search.browse_all')}
        <Icon name="arrow-right" />
      </a>
    </lazy-section>
  );
}
