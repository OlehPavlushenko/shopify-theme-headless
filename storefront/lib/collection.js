// A collection page's data in the shape the theme's facets snippets use (collection.filters, sort,
// paginate): the collection (with the theme's metafields), its storefront filters (Search & Discovery)
// with active values and links to remove them, a page of products, the count and the next page.
// URL parameters: filter.<id>=<value> as the Storefront API names them (filter.p.vendor=white-mandarin,
// filter.v.availability=1), filter.v.price.gte / .lte, sort_by (Shopify's values), after (cursor) + page.
import { admin } from './admin.js';
import { storefront } from './shopify.js';
import { PRODUCT_CARD } from './queries.js';
import { richTextHtml } from './richtext.js';

const IMAGE = 'url altText width height';

// Shopify's sort options (collection.sort_options): key — ProductCollectionSortKeys (a collection),
// allKey — ProductSortKeys (every product), order — the Admin API's sort order of a collection
export const SORT_OPTIONS = [
  { value: 'manual', name: 'Featured', key: 'COLLECTION_DEFAULT', allKey: 'TITLE', order: 'MANUAL' },
  { value: 'most-relevant', name: 'Most relevant', key: 'RELEVANCE', allKey: 'TITLE', order: 'MOST_RELEVANT' },
  { value: 'best-selling', name: 'Best selling', key: 'BEST_SELLING', allKey: 'BEST_SELLING', order: 'BEST_SELLING' },
  { value: 'title-ascending', name: 'Alphabetically, A-Z', key: 'TITLE', allKey: 'TITLE', order: 'ALPHA_ASC' },
  { value: 'title-descending', name: 'Alphabetically, Z-A', key: 'TITLE', allKey: 'TITLE', reverse: true, order: 'ALPHA_DESC' },
  { value: 'price-ascending', name: 'Price, low to high', key: 'PRICE', allKey: 'PRICE', order: 'PRICE_ASC' },
  { value: 'price-descending', name: 'Price, high to low', key: 'PRICE', allKey: 'PRICE', reverse: true, order: 'PRICE_DESC' },
  { value: 'created-ascending', name: 'Date, old to new', key: 'CREATED', allKey: 'CREATED_AT', order: 'CREATED' },
  { value: 'created-descending', name: 'Date, new to old', key: 'CREATED', allKey: 'CREATED_AT', reverse: true, order: 'CREATED_DESC' },
];

const PRICE = 'filter.v.price';

// What the Storefront API doesn't give, through the Admin API (lib/admin.js): the collection's own sort
// order (the list's default, as collection.default_sort_by) and its product count
async function collectionFacts(handle) {
  const data = await admin(`query ($handle: String!) { collectionByHandle(handle: $handle) { sortOrder productsCount { count } } }`, {
    handle,
  });
  const facts = data?.collectionByHandle;
  return { defaultSort: SORT_OPTIONS.find((option) => option.order === facts?.sortOrder)?.value, count: facts?.productsCount?.count };
}

// The collections page (main-list-collections): every collection with its description, image, the first
// four products' images (in the collection's own sort order, as collection.products) and the theme's
// metafields (theme.hidden, theme.featured); the product count and the sort order from the Admin API
// (as collection.products_count), else the products the storefront sees and the default order
export async function getCollectionList() {
  const [data, facts] = await Promise.all([
    storefront(
      `#graphql
      query CollectionList {
        collections(first: 100, sortKey: TITLE) {
          nodes {
            handle
            title
            description
            image { ${IMAGE} }
            hidden: metafield(namespace: "theme", key: "hidden") { value }
            featured: metafield(namespace: "theme", key: "featured") { value }
            all: products(first: 250) { nodes { id } }
          }
        }
      }`
    ),
    admin(`{ collections(first: 250) { nodes { handle sortOrder productsCount { count } } } }`),
  ]);
  const nodes = data?.collections.nodes ?? [];
  const factsOf = new Map(facts?.collections.nodes.map((item) => [item.handle, item]));
  const sortOf = (handle) => SORT_OPTIONS.find((option) => option.order === factsOf.get(handle)?.sortOrder) ?? SORT_OPTIONS[0];
  const fields = nodes.map(({ handle }, index) => {
    const sort = sortOf(handle);
    return `c${index}: collection(handle: ${JSON.stringify(handle)}) {
      products(first: 4, sortKey: ${sort.key}, reverse: ${Boolean(sort.reverse)}) { nodes { featuredImage { ${IMAGE} } } }
    }`;
  });
  const products = fields.length ? await storefront(`query CollectionListProducts { ${fields.join('\n')} }`) : null;
  return nodes.map(({ all, hidden, featured, ...collection }, index) => ({
    ...collection,
    hidden: hidden?.value === 'true',
    featured: featured?.value === 'true',
    products: products?.[`c${index}`]?.products ?? { nodes: [] },
    productsCount: factsOf.get(collection.handle)?.productsCount.count ?? all.nodes.length,
  }));
}

// "all" (Shopify's /collections/all) has no collection in the Storefront API. Unfiltered: the product
// list, A-Z by default as in Shopify; filtered: an empty search (it takes filters, sorts by relevance or
// price). The search also gives the filters and the exact count.
const ALL = { id: 'all', handle: 'all', title: 'Products', description: '', descriptionHtml: '', seo: {}, image: null };

async function getAllBase() {
  const data = await storefront(
    `{ search(query: "", first: 1, types: PRODUCT) { totalCount productFilters { id label type values { id label input } } } }`
  );
  return data ? { ...ALL, totalCount: data.search.totalCount, products: { filters: data.search.productFilters } } : null;
}

async function getAllProducts({ first, after, sort, filters, base, query = '' }) {
  if (!filters.length && !query) {
    const [list, search] = await Promise.all([
      storefront(
        `#graphql
        query AllProducts($first: Int!, $after: String, $sortKey: ProductSortKeys!, $reverse: Boolean!) {
          products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse) {
            pageInfo { hasNextPage endCursor }
            nodes { ...ProductCard }
          }
        }
        ${PRODUCT_CARD}`,
        { first, after, sortKey: sort.allKey, reverse: Boolean(sort.reverse) }
      ),
      storefront(
        `{ search(query: "", first: 1, types: PRODUCT) { productFilters { id label type presentation values { id label count input swatch { color image { previewImage { url } } } } } } }`
      ),
    ]);
    return { filters: search.search.productFilters, ...list.products, totalCount: base.totalCount };
  }
  const data = await storefront(
    `#graphql
    query AllProducts($query: String!, $first: Int!, $after: String, $sortKey: SearchSortKeys!, $reverse: Boolean!, $filters: [ProductFilter!]) {
      search(query: $query, first: $first, after: $after, types: PRODUCT, sortKey: $sortKey, reverse: $reverse, productFilters: $filters) {
        totalCount
        productFilters { id label type presentation values { id label count input swatch { color image { previewImage { url } } } } }
        pageInfo { hasNextPage endCursor }
        nodes { ... on Product { ...ProductCard } }
      }
    }
    ${PRODUCT_CARD}`,
    {
      query,
      first,
      after,
      sortKey: sort.key === 'PRICE' ? 'PRICE' : 'RELEVANCE',
      reverse: Boolean(sort.key === 'PRICE' && sort.reverse),
      filters,
    }
  );
  const { totalCount, productFilters, pageInfo, nodes } = data.search;
  return { filters: productFilters, pageInfo, nodes, totalCount };
}

// Shopify's automatic collections of a product type or vendor (/collections/types?q=…, /collections/vendors?q=…,
// as link_to_type / link_to_vendor make them): every product of it through the search — a type as a search
// query (the productType filter only works when it is on in Search & Discovery), a vendor as the exact
// productVendor filter (the query also matches other vendors that contain the name)
const AUTOMATIC = {
  types: (value) => ({ query: `product_type:"${value.replace(/["\\]/g, '')}"` }),
  vendors: (value) => ({ filter: { productVendor: value } }),
};

// The collection with the theme's metafields and its filters without any filter on (to read the URL)
async function getCollectionBase(handle) {
  if (handle === 'all') return getAllBase();
  const data = await storefront(
    `#graphql
    query CollectionBase($handle: String!) {
      collection(handle: $handle) {
        id
        handle
        title
        description
        descriptionHtml
        seo { title description }
        image { ${IMAGE} }
        subcollections: metafield(namespace: "theme", key: "subcollections") {
          references(first: 20) {
            nodes {
              ... on Collection {
                handle
                title
                image { ${IMAGE} }
                products(first: 1) { nodes { featuredImage { ${IMAGE} } } }
                count: products(first: 250) { nodes { id } }
              }
            }
          }
        }
        seoText: metafield(namespace: "theme", key: "seo_text") { value }
        seoHeading: metafield(namespace: "theme", key: "seo_heading") { value }
        products(first: 1) { filters { id label type values { id label input } } }
      }
    }`,
    { handle }
  );
  return data?.collection ?? null;
}

// Storefront filter inputs for the URL's parameters
function inputsFor(params, filters) {
  const inputs = [];
  for (const filter of filters) {
    if (filter.type === 'PRICE_RANGE') {
      const min = params.get(`${PRICE}.gte`);
      const max = params.get(`${PRICE}.lte`);
      if (min || max) inputs.push({ price: { ...(min && { min: Number(min) }), ...(max && { max: Number(max) }) } });
      continue;
    }
    for (const value of params.getAll(filter.id)) {
      const match = filter.values.find((item) => item.id === `${filter.id}.${value}`);
      if (match) inputs.push(JSON.parse(match.input));
    }
  }
  return inputs;
}

// The URL of the list with params changed (without the cursor: a filter change starts on page 1)
function urlWith(path, params, change) {
  const next = new URLSearchParams(params);
  next.delete('after');
  next.delete('page');
  change(next);
  const query = next.toString();
  return `${path}${query ? `?${query}` : ''}`;
}

export async function getCollectionPage(handle, params, { perPage = 16 } = {}) {
  const automatic = AUTOMATIC[handle] && (params.get('q') ?? '').trim();
  if (AUTOMATIC[handle] && !automatic) return null;
  const [found, facts] = await Promise.all([
    automatic ? getAllBase() : getCollectionBase(handle),
    handle === 'all' ? { defaultSort: 'title-ascending' } : automatic ? { defaultSort: 'most-relevant' } : collectionFacts(handle),
  ]);
  if (!found) return null;
  const base = automatic ? { ...found, id: handle, handle, title: automatic, totalCount: undefined } : found;
  const path = `/collections/${handle}`;
  const byValue = (value) => SORT_OPTIONS.find((option) => option.value === value);
  const sort = byValue(params.get('sort_by')) ?? byValue(facts.defaultSort) ?? SORT_OPTIONS[0];
  const after = params.get('after');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const filtersIn = inputsFor(params, base.products.filters);

  // A type's or vendor's collection: the search for it (the search's total is its count)
  const { query = '', filter } = automatic ? AUTOMATIC[handle](automatic) : {};
  const filtersAll = filter ? [filter, ...filtersIn] : filtersIn;
  const data =
    handle === 'all' || automatic
      ? { collection: { products: await getAllProducts({ first: perPage, after, sort, filters: filtersAll, base, query }) } }
      : await storefront(
          `#graphql
    query CollectionPage($handle: String!, $first: Int!, $after: String, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!, $filters: [ProductFilter!]) {
      collection(handle: $handle) {
        products(first: $first, after: $after, sortKey: $sortKey, reverse: $reverse, filters: $filters) {
          filters { id label type presentation values { id label count input swatch { color image { previewImage { url } } } } }
          pageInfo { hasNextPage endCursor }
          nodes { ...ProductCard }
        }
      }
    }
    ${PRODUCT_CARD}`,
          { handle, first: perPage, after, sortKey: sort.key, reverse: Boolean(sort.reverse), filters: filtersIn }
        );
  const { filters: rawFilters, pageInfo, nodes: products, totalCount } = data.collection.products;
  // A type or vendor without products has no collection (Shopify answers 404)
  if (automatic && totalCount === 0 && filtersIn.length === 0) return null;
  const filters = shapeFilters(rawFilters, params, path);
  const activeCount = countActive(filters);
  // The count: the search's total ("all"), the collection's own (Admin API) while nothing is filtered,
  // else the availability filter's values, which add up to every product of the list
  const availability = filters.find((filter) => filter.id === 'filter.v.availability');
  const count =
    totalCount ??
    (activeCount === 0 ? facts.count : undefined) ??
    (availability
      ? availability.values
          .filter((value) => !availability.values.some((item) => item.active) || value.active)
          .reduce((sum, value) => sum + value.count, 0)
      : products.length);

  return {
    collection: {
      ...base,
      subcollections: (base.subcollections?.references?.nodes ?? [])
        .filter((sub) => sub.handle)
        .map(({ count: all, ...sub }) => ({ ...sub, productsCount: all.nodes.length })),
      seoTextHtml: richTextHtml(base.seoText?.value),
      seoHeading: base.seoHeading?.value ?? '',
    },
    filters,
    products,
    sortBy: sort.value,
    sortOptions: SORT_OPTIONS,
    activeCount,
    count,
    page,
    shown: (page - 1) * perPage + products.length,
    nextUrl: nextPageUrl(path, params, pageInfo, page),
    // Without the filters, keeping the sort (and a type's or vendor's q)
    clearUrl: urlWith(
      path,
      new URLSearchParams({ ...(automatic && { q: automatic }), ...(params.has('sort_by') && { sort_by: params.get('sort_by') }) }),
      () => {}
    ),
  };
}

// The next page's URL (the cursor and the page number), or null on the last page
function nextPageUrl(path, params, pageInfo, page) {
  if (!pageInfo.hasNextPage) return null;
  const next = new URLSearchParams(params);
  next.set('after', pageInfo.endCursor);
  next.set('page', page + 1);
  return `${path}?${next}`;
}

// How many filter values are on (a price range counts once)
function countActive(filters) {
  return filters.reduce(
    (sum, filter) =>
      sum +
      (filter.type === 'price_range'
        ? filter.min.value || filter.max.value
          ? 1
          : 0
        : filter.values.filter((value) => value.active).length),
    0
  );
}

// Filters in the theme's shape: values with param_name / value / active / url_to_remove
function shapeFilters(rawFilters, params, path) {
  return rawFilters.map((filter) => {
    if (filter.type === 'PRICE_RANGE') {
      const range = JSON.parse(filter.values[0]?.input ?? '{"price":{"max":0}}').price;
      const min = params.get(`${PRICE}.gte`);
      const max = params.get(`${PRICE}.lte`);
      return {
        id: filter.id,
        label: filter.label,
        type: 'price_range',
        rangeMax: range.max ?? 0,
        min: { param: `${PRICE}.gte`, value: min ?? '' },
        max: { param: `${PRICE}.lte`, value: max ?? '' },
        urlToRemove: urlWith(path, params, (next) => {
          next.delete(`${PRICE}.gte`);
          next.delete(`${PRICE}.lte`);
        }),
      };
    }
    const chosen = params.getAll(filter.id);
    const values = filter.values.map((value) => {
      const part = value.id.slice(filter.id.length + 1);
      const active = chosen.includes(part);
      return {
        label: value.label,
        count: value.count,
        param: filter.id,
        value: part,
        active,
        swatch: value.swatch,
        urlToRemove: urlWith(path, params, (next) => {
          const rest = next.getAll(filter.id).filter((item) => item !== part);
          next.delete(filter.id);
          rest.forEach((item) => next.append(filter.id, item));
        }),
      };
    });
    return {
      id: filter.id,
      label: filter.label,
      type: filter.type === 'BOOLEAN' ? 'boolean' : 'list',
      presentation: filter.presentation,
      values,
    };
  });
}

// Shopify's search sort options (search.sort_options); relevance by default
export const SEARCH_SORT_OPTIONS = [
  { value: 'relevance', name: 'Relevance', key: 'RELEVANCE' },
  { value: 'price-ascending', name: 'Price, low to high', key: 'PRICE' },
  { value: 'price-descending', name: 'Price, high to low', key: 'PRICE', reverse: true },
];

// The search's own options, as snippets/search-options adds them to every search link
const SEARCH_OPTIONS = { type: 'product', 'options[prefix]': 'last', 'options[unavailable_products]': 'last' };

const SEARCH = `#graphql
  query SearchPage($q: String!, $first: Int!, $after: String, $sortKey: SearchSortKeys!, $reverse: Boolean!, $filters: [ProductFilter!]) {
    search(query: $q, first: $first, after: $after, types: PRODUCT, prefix: LAST, unavailableProducts: LAST,
      sortKey: $sortKey, reverse: $reverse, productFilters: $filters) {
      totalCount
      productFilters { id label type presentation values { id label count input swatch { color image { previewImage { url } } } } }
      pageInfo { hasNextPage endCursor }
      nodes { ... on Product { ...ProductCard } }
    }
  }
  ${PRODUCT_CARD}`;

// The search page's results in the collection page's shape (main-collection on templates/search.json):
// the products found for ?q=, their filters, sort and count. { performed: false } without terms.
export async function getSearchPage(params, { perPage = 24 } = {}) {
  const terms = (params.get('q') ?? '').trim();
  if (!terms) return { performed: false, terms: '' };
  const path = '/search';
  const sort = SEARCH_SORT_OPTIONS.find((option) => option.value === params.get('sort_by')) ?? SEARCH_SORT_OPTIONS[0];
  const after = params.get('after');
  const page = Math.max(1, Number(params.get('page')) || 1);
  const variables = { q: terms, first: perPage, after, sortKey: sort.key, reverse: Boolean(sort.reverse) };
  // The filters' inputs come from the unfiltered search: a second request only when a filter is on
  let data = await storefront(SEARCH, variables);
  if (!data) return null;
  const filtersIn = inputsFor(params, data.search.productFilters);
  if (filtersIn.length) data = await storefront(SEARCH, { ...variables, filters: filtersIn });
  const { totalCount, productFilters, pageInfo, nodes: products } = data.search;
  const filters = shapeFilters(productFilters, params, path);
  return {
    performed: true,
    terms,
    collection: { handle: 'search' },
    filters,
    products,
    sortBy: sort.value,
    sortOptions: SEARCH_SORT_OPTIONS,
    activeCount: countActive(filters),
    count: totalCount,
    page,
    shown: (page - 1) * perPage + products.length,
    nextUrl: nextPageUrl(path, params, pageInfo, page),
    clearUrl: `${path}?${new URLSearchParams({ q: terms, ...SEARCH_OPTIONS, sort_by: sort.value })}`,
  };
}
