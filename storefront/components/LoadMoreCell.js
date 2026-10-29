// "Load more" as the last cell of a paginated grid: theme/snippets/load-more-cell.liquid — "Showing 24 of
// 86", a progress bar and the link to the next page (<load-more>, @ui/load-more). Nothing on the last page.
import { t } from '@/lib/theme.js';

export default function LoadMoreCell({ nextUrl, shown, total }) {
  if (!nextUrl) return null;
  return (
    <li className="load-more" data-load-more-cell="">
      <p className="load-more__progress">{t('facets.progress', { shown, total })}</p>
      {/* Liquid's integer divided_by: rounded down */}
      <span className="load-more__bar" style={{ '--progress': `${Math.floor((shown * 100) / Math.max(total, 1))}%` }} aria-hidden="true" />
      <a href={nextUrl} className="btn btn--outline" data-load-more-link="">
        {t('facets.load_more')}
      </a>
    </li>
  );
}
