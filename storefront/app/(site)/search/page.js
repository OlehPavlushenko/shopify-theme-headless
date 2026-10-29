// Search page: the theme's main-search — a GET form (?q=) and the products found. noindex, as in the theme.
import '@ui-css/facets.css';
import '@ui-css/search.css';
import ProductCard from '@/components/ProductCard.js';
import Icon from '@/components/Icon.js';
import { searchProducts } from '@/lib/queries.js';

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : 'Search', robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }) {
  const query = String((await searchParams).q ?? '').trim();
  const results = query ? await searchProducts(query) : null;

  return (
    <div className="main-search section-spacing">
      <div className="page-width main-search__inner">
        <h1 className="h2 main-search__title">{query ? `Results for “${query}”` : 'Search'}</h1>
        {/* <form-validate> as in the theme: the search.css rules stretch the form through it */}
        <form-validate>
          <form action="/search" method="get" className="search-form" role="search">
            <label htmlFor="MainSearchInput" className="visually-hidden">
              Search
            </label>
            <span className="search-field">
              <Icon name="search" />
              <input
                id="MainSearchInput"
                className="input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search products"
                enterKeyHint="search"
                autoComplete="off"
                required
              />
            </span>
            <button type="submit" className="btn">
              Search
            </button>
          </form>
        </form-validate>
      </div>

      {results && (
        <div className="page-width section-spacing">
          <div className="facets__toolbar">
            <p className="facets__count" role="status">
              {results.totalCount} {results.totalCount === 1 ? 'result' : 'results'}
            </p>
          </div>
          {results.nodes.length > 0 ? (
            <ul className="grid facets__grid" role="list" style={{ '--cols': 4, '--cols-tablet': 3, '--cols-mobile': 2 }}>
              {results.nodes.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="h5">Nothing found</p>
              <p>Try another word or check the spelling.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
