// A store search form: theme/snippets/search-form.liquid — the field with its search icon, the search's
// options (snippets/search-options: products, or the blog's articles) and the submit button, inside
// <form-validate> (an empty field isn't sent). The search panel has its own form (SearchPanel.js).
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

export function SearchOptions({ scope = 'products' }) {
  return scope === 'articles' ? (
    <>
      <input type="hidden" name="type" value="article" />
      <input type="hidden" name="options[prefix]" value="last" />
      <input type="hidden" name="view" value="blog" />
    </>
  ) : (
    <>
      <input type="hidden" name="type" value="product" />
      <input type="hidden" name="options[prefix]" value="last" />
      <input type="hidden" name="options[unavailable_products]" value="last" />
    </>
  );
}

export default function SearchForm({ id, value, placeholder, label, scope, className = 'search-form', wrapClass, sectionForm }) {
  return (
    <form-validate class={wrapClass} data-message-required={t('search.empty_query')}>
      <form action="/search" method="get" role="search" className={className} data-section-form={sectionForm ? '' : undefined}>
        <label className="visually-hidden" htmlFor={id}>
          {label || t('search.title')}
        </label>
        <span className="search-field">
          <Icon name="search" />
          <input
            id={id}
            className="input"
            type="search"
            name="q"
            defaultValue={value || undefined}
            placeholder={placeholder || t('search.placeholder')}
            autoComplete="off"
            enterKeyHint="search"
            required
          />
        </span>
        <SearchOptions scope={scope} />
        <button type="submit" className="btn">
          {t('search.submit')}
        </button>
      </form>
    </form-validate>
  );
}
