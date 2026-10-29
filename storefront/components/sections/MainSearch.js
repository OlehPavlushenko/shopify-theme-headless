// theme/sections/main-search.liquid: breadcrumbs, the h1 ("Results for “…”" or "Search"), the search field
// with the current terms and, before a search, popular collections as chips. The results are main-collection.
import Link from 'next/link';
import Breadcrumbs from '../Breadcrumbs.js';
import SearchForm from '../SearchForm.js';
import { getCollectionsByHandles } from '@/lib/queries.js';
import { t } from '@/lib/theme.js';

const escapeHtml = (text) => text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);

export default async function MainSearch({ section, context = {} }) {
  const { settings } = section;
  const terms = context.listing?.terms ?? '';
  const performed = Boolean(context.listing?.performed);
  const collections = !performed && settings.collections?.length ? await getCollectionsByHandles(settings.collections) : [];
  return (
    <div className={`main-search color-${settings.color_scheme} section-spacing`}>
      <div className="page-width main-search__inner">
        <Breadcrumbs current={t('search.title')} />
        <h1
          className="h2 main-search__title"
          dangerouslySetInnerHTML={{
            __html: performed && terms ? t('search.results_title_html', { terms: escapeHtml(terms) }) : escapeHtml(t('search.title')),
          }}
        />
        <SearchForm id="MainSearchInput" value={terms} />
        {collections.length > 0 && (
          <div className="main-search__popular">
            <p className="eyebrow">{t('search.popular_collections')}</p>
            <ul className="main-search__chips" role="list">
              {collections.map((item) => (
                <li key={item.handle}>
                  <Link href={`/collections/${item.handle}`} className="chip">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
