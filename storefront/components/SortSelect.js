'use client';
// The collection's sort (theme: .facets__sort in snippets/facets-page.liquid). A GET form: picking an
// option submits it at once; without JS the button does. Options: lib/sorts.js.
import { SORTS } from '@/lib/sorts.js';

export default function SortSelect({ value }) {
  return (
    <form method="get">
      <label className="facets__sort">
        <span className="facets__sort-label">Sort by</span>
        <select
          name="sort"
          className="facets__sort-select"
          defaultValue={value}
          onChange={(event) => event.currentTarget.form.requestSubmit()}
        >
          {SORTS.map((sort) => (
            <option key={sort.value} value={sort.value}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
      <noscript>
        <button type="submit" className="btn btn--sm btn--outline">
          Sort
        </button>
      </noscript>
    </form>
  );
}
