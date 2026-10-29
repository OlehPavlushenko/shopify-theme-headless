// GraphQL documents and the loaders built on them. One fragment per component, named after it.
import { storefront } from './shopify.js';

export const PRODUCT_CARD = `#graphql
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    featuredImage { url altText width height }
    images(first: 2) { nodes { url altText width height } }
    priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
    compareAtPriceRange { maxVariantPrice { amount currencyCode } }
    selectedOrFirstAvailableVariant {
      id
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
    }
    options(first: 1) { name optionValues { name swatch { color image { previewImage { url } } } } }
    variants(first: 50) { nodes { availableForSale selectedOptions { name value } } }
    rating: metafield(namespace: "reviews", key: "rating") { value }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
    label: metafield(namespace: "custom", key: "label") { value }
    offerEnds: metafield(namespace: "custom", key: "offer_ends") { value }
  }
`;

const MENU = `#graphql
  fragment Menu on Menu {
    items { id title url items { id title url } }
  }
`;

// The site frame: shop name, header and footer menus, policies
export async function getShell() {
  const data = await storefront(
    `#graphql
    query Shell($header: String!, $footer: String!) {
      shop {
        name
        description
        privacyPolicy { title url }
        refundPolicy { title url }
        shippingPolicy { title url }
        termsOfService { title url }
      }
      header: menu(handle: $header) { ...Menu }
      footer: menu(handle: $footer) { ...Menu }
    }
    ${MENU}`,
    { header: process.env.SHOPIFY_HEADER_MENU || 'main-menu', footer: process.env.SHOPIFY_FOOTER_MENU || 'footer' }
  );
  if (!data) return { shop: { name: 'Storefront' }, header: [], footer: [], policies: [] };
  const { shop, header, footer } = data;
  const policies = [shop.privacyPolicy, shop.refundPolicy, shop.shippingPolicy, shop.termsOfService].filter(Boolean);
  return { shop, header: header?.items ?? [], footer: footer?.items ?? [], policies };
}

// Products for a list on the home page (best sellers first)
export async function getProducts(first = 8) {
  const data = await storefront(
    `#graphql
    query Products($first: Int!) {
      products(first: $first, sortKey: BEST_SELLING) { nodes { ...ProductCard } }
    }
    ${PRODUCT_CARD}`,
    { first }
  );
  return data?.products.nodes ?? [];
}

const IMAGE = 'url altText width height';

// A menu by handle (Admin > Content > Menus), three levels, as [{ id, title, url, items }]
export async function getMenu(handle) {
  if (!handle) return [];
  const data = await storefront(
    `#graphql
    query Menu($handle: String!) {
      menu(handle: $handle) {
        items { id title url items { id title url items { id title url } } }
      }
    }`,
    { handle }
  );
  return data?.menu?.items ?? [];
}

// Collections picked in a theme setting (handles), in that order: cover (its image or its first
// product's) and product count (snippets/collection-card)
export async function getCollectionsByHandles(handles = []) {
  if (!handles.length) return [];
  const fields = handles.map(
    (handle, index) => `c${index}: collection(handle: ${JSON.stringify(handle)}) {
      handle title image { ${IMAGE} }
      products(first: 1) { nodes { featuredImage { ${IMAGE} } } }
      count: products(first: 250) { nodes { id } }
    }`
  );
  const data = await storefront(`query PickedCollections { ${fields.join('\n')} }`);
  return handles
    .map((_, index) => data?.[`c${index}`])
    .filter(Boolean)
    .map(({ count, ...collection }) => ({ ...collection, productsCount: count.nodes.length }));
}

// A product with its images and every variant: the quick view and the product page's form
export async function getProductWithVariants(handle) {
  const data = await storefront(
    `#graphql
    query ProductVariants($handle: String!) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        availableForSale
        images(first: 20) { nodes { id ${IMAGE} } }
        options(first: 10) { name optionValues { name swatch { color image { previewImage { url } } } } }
        variants(first: 100) {
          nodes {
            id
            availableForSale
            selectedOptions { name value }
            price { ${MONEY} }
            compareAtPrice { ${MONEY} }
            image { id }
          }
        }
        selectedOrFirstAvailableVariant {
          id
          availableForSale
          selectedOptions { name value }
          price { ${MONEY} }
          compareAtPrice { ${MONEY} }
        }
      }
    }`,
    { handle }
  );
  return data?.product ?? null;
}

// Shopify's related products for a product (Product Recommendations, intent RELATED)
export async function getRecommendations(handle) {
  const data = await storefront(
    `#graphql
    query Recommendations($handle: String!) {
      productRecommendations(productHandle: $handle, intent: RELATED) { ...ProductCard }
    }
    ${PRODUCT_CARD}`,
    { handle },
    { revalidate: 3600 }
  );
  return data?.productRecommendations ?? [];
}

// A page (Admin > Online Store > Pages)
export async function getPage(handle) {
  const data = await storefront(
    `#graphql
    query Page($handle: String!) { page(handle: $handle) { handle title body bodySummary seo { title description } } }`,
    { handle }
  );
  return data?.page ?? null;
}

// One product with what the compare table shows (sections/compare-column): the card's data, type,
// description, every option with its values
export async function getCompareProduct(handle) {
  const data = await storefront(
    `#graphql
    query CompareProduct($handle: String!) {
      product(handle: $handle) {
        ...ProductCard
        productType
        description
        allOptions: options(first: 10) { name optionValues { name swatch { color image { previewImage { url } } } } }
        allVariants: variants(first: 100) { nodes { availableForSale selectedOptions { name value } } }
      }
    }
    ${PRODUCT_CARD}`,
    { handle }
  );
  return data?.product ?? null;
}

// Products picked in a theme setting (a list of handles), in that order; missing ones are skipped
export async function getProductsByHandles(handles = []) {
  if (!handles.length) return [];
  const fields = handles.map((handle, index) => `p${index}: product(handle: ${JSON.stringify(handle)}) { ...ProductCard }`);
  const data = await storefront(`query PickedProducts { ${fields.join('\n')} } ${PRODUCT_CARD}`);
  return handles.map((_, index) => data?.[`p${index}`]).filter(Boolean);
}
const MONEY = 'amount currencyCode';

// Product page: the product, its variants and the variant matching the picked options
// (selectedOptions: [{ name, value }], from the URL; unknown or missing ones fall back to the first available)
export async function getProduct(handle, selectedOptions = []) {
  const data = await storefront(
    `#graphql
    query Product($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        description
        descriptionHtml
        availableForSale
        seo { title description }
        featuredImage { ${IMAGE} }
        images(first: 20) { nodes { id ${IMAGE} } }
        options { name optionValues { name swatch { color } } }
        variants(first: 100) {
          nodes { id availableForSale selectedOptions { name value } }
        }
        selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
          id
          title
          sku
          availableForSale
          selectedOptions { name value }
          price { ${MONEY} }
          compareAtPrice { ${MONEY} }
          image { id ${IMAGE} }
        }
        collections(first: 1) { nodes { handle title } }
      }
    }`,
    { handle, selectedOptions }
  );
  return data?.product ?? null;
}

// Collection page: a page of products (24), sorted, after the cursor of the previous page.
// "all" is every product (as Shopify's /collections/all): allKey is its ProductSortKeys value.
export async function getCollection(
  handle,
  { sortKey = 'COLLECTION_DEFAULT', allKey = 'BEST_SELLING', reverse = false, after = null } = {}
) {
  if (handle === 'all') {
    const data = await storefront(
      `#graphql
      query AllProducts($sortKey: ProductSortKeys!, $reverse: Boolean!, $after: String) {
        products(first: 24, sortKey: $sortKey, reverse: $reverse, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { ...ProductCard }
        }
      }
      ${PRODUCT_CARD}`,
      { sortKey: allKey, reverse, after }
    );
    if (!data) return null;
    return { handle, title: 'All products', description: '', descriptionHtml: '', seo: {}, image: null, products: data.products };
  }
  const data = await storefront(
    `#graphql
    query Collection($handle: String!, $sortKey: ProductCollectionSortKeys!, $reverse: Boolean!, $after: String) {
      collection(handle: $handle) {
        handle
        title
        description
        descriptionHtml
        seo { title description }
        image { ${IMAGE} }
        products(first: 24, sortKey: $sortKey, reverse: $reverse, after: $after) {
          pageInfo { hasNextPage endCursor }
          nodes { ...ProductCard }
        }
      }
    }
    ${PRODUCT_CARD}`,
    { handle, sortKey, reverse, after }
  );
  return data?.collection ?? null;
}

// The latest articles of a blog (snippets/article-card); without a handle, the store's first blog
export async function getArticles(handle, first = 6) {
  const fields = `handle title articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
    nodes { handle title excerpt content publishedAt tags image { ${IMAGE} } blog { handle } }
  }`;
  const data = await storefront(
    handle
      ? `query Articles($handle: String!, $first: Int!) { blog(handle: $handle) { ${fields} } }`
      : `query Articles($first: Int!) { blogs(first: 1) { nodes { ${fields} } } }`,
    handle ? { handle, first } : { first }
  );
  const blog = handle ? data?.blog : data?.blogs.nodes[0];
  return blog ? { handle: blog.handle, title: blog.title, articles: blog.articles.nodes } : { handle: null, title: '', articles: [] };
}

// Search-as-you-type (the search panel): query suggestions, collections and products
export async function predictiveSearch(query) {
  const data = await storefront(
    `#graphql
    query Predictive($query: String!) {
      predictiveSearch(query: $query, limit: 10, types: [QUERY, COLLECTION, PRODUCT]) {
        queries { text styledText }
        collections { handle title }
        products { ...ProductCard }
      }
    }
    ${PRODUCT_CARD}`,
    { query },
    { revalidate: 60 }
  );
  return data?.predictiveSearch ?? { queries: [], collections: [], products: [] };
}

// Every collection with its image (or its first product's): the collection list section without picks
export async function getCollections() {
  const data = await storefront(
    `#graphql
    query Collections {
      collections(first: 100, sortKey: TITLE) {
        nodes {
          handle
          title
          image { ${IMAGE} }
          products(first: 1) { nodes { featuredImage { ${IMAGE} } } }
        }
      }
    }`
  );
  return data?.collections.nodes ?? [];
}

// Every product and collection URL with its last update, for sitemap.xml (250 each, the API's page size)
export async function getSitemapEntries() {
  const data = await storefront(
    `#graphql
    query Sitemap {
      products(first: 250) { nodes { handle updatedAt } }
      collections(first: 250) { nodes { handle updatedAt } }
      pages(first: 250) { nodes { handle updatedAt } }
      articles(first: 250) { nodes { handle publishedAt blog { handle } } }
      blogs(first: 50) { nodes { handle } }
    }`,
    {},
    { revalidate: 3600 }
  );
  return {
    products: data?.products.nodes ?? [],
    collections: data?.collections.nodes ?? [],
    pages: data?.pages.nodes ?? [],
    articles: data?.articles.nodes ?? [],
    blogs: data?.blogs.nodes ?? [],
  };
}

// The cart (per visitor: never cached)
export const CART = `#graphql
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    note
    attributes { key value }
    cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
    discountCodes { code applicable }
    discountAllocations {
      discountedAmount { ${MONEY} }
      ... on CartCodeDiscountAllocation { code }
      ... on CartAutomaticDiscountAllocation { title }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ${MONEY} } amountPerQuantity { ${MONEY} } compareAtAmountPerQuantity { ${MONEY} } }
        merchandise {
          ... on ProductVariant {
            id
            title
            selectedOptions { name value }
            image { ${IMAGE} }
            product { handle title }
          }
        }
      }
    }
  }
`;
