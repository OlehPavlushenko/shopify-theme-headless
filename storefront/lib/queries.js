// GraphQL documents and the loaders built on them. One fragment per component, named after it; the field
// lists the other lib/ modules share are exported here too.
import { storefront } from './shopify.js';

export const IMAGE = 'url altText width height';
export const MONEY = 'amount currencyCode';
// Shopify's swatch of an option value or a filter value
export const SWATCH = `swatch { color image { previewImage { url } } }`;
// An option with its values (variant pickers, swatches)
export const OPTION = `name optionValues { name ${SWATCH} }`;
// An article as the article card and the blog pages read it (snippets/article-card)
export const ARTICLE = `handle title excerpt content publishedAt tags image { ${IMAGE} } blog { handle }`;
// A collection card's fields (snippets/collection-card): cover (its image or its first product's) and,
// through withProductsCount, the product count
export const COLLECTION_CARD = `handle title image { ${IMAGE} }
  products(first: 1) { nodes { featuredImage { ${IMAGE} } } }
  count: products(first: 250) { nodes { id } }`;

// COLLECTION_CARD's count as productsCount
export const withProductsCount = ({ count, ...collection }) => ({ ...collection, productsCount: count.nodes.length });

// The product card's fields (components/ProductCard.js, ProductRow.js)
export const PRODUCT_CARD = `#graphql
  fragment ProductCard on Product {
    id
    handle
    title
    vendor
    availableForSale
    featuredImage { ${IMAGE} }
    images(first: 2) { nodes { ${IMAGE} } }
    priceRange { minVariantPrice { ${MONEY} } maxVariantPrice { ${MONEY} } }
    compareAtPriceRange { maxVariantPrice { ${MONEY} } }
    selectedOrFirstAvailableVariant {
      id
      price { ${MONEY} }
      compareAtPrice { ${MONEY} }
    }
    options(first: 1) { ${OPTION} }
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

// A policy's title as Liquid's policy.title gives it ("Refund policy"; the API says "Refund Policy")
const policyTitled = (policy) => ({ ...policy, title: policy.title.charAt(0) + policy.title.slice(1).toLowerCase() });

// The site frame: shop name, header and footer menus, policies
export async function getShell() {
  const data = await storefront(
    `#graphql
    query Shell($header: String!, $footer: String!) {
      shop {
        name
        description
        paymentSettings { currencyCode }
        privacyPolicy { title handle }
        refundPolicy { title handle }
        shippingPolicy { title handle }
        termsOfService { title handle }
      }
      header: menu(handle: $header) { ...Menu }
      footer: menu(handle: $footer) { ...Menu }
    }
    ${MENU}`,
    { header: process.env.SHOPIFY_HEADER_MENU || 'main-menu', footer: process.env.SHOPIFY_FOOTER_MENU || 'footer' }
  );
  if (!data) return { shop: { name: 'Storefront' }, header: [], footer: [], policies: [] };
  const { shop, header, footer } = data;
  // In shop.policies' order, as the theme's footer lists them
  const policies = [shop.refundPolicy, shop.privacyPolicy, shop.shippingPolicy, shop.termsOfService].filter(Boolean).map(policyTitled);
  return { shop, header: header?.items ?? [], footer: footer?.items ?? [], policies };
}

// Shopify Markets for the switchers (snippets/localization-form): the current country and language, the
// countries with their currency and languages, the languages of the current country
export async function getLocalization() {
  const data = await storefront(
    `#graphql
    query Localization {
      localization {
        country { isoCode currency { isoCode symbol } }
        language { isoCode }
        availableLanguages { isoCode endonymName }
        availableCountries { isoCode currency { isoCode symbol } availableLanguages { isoCode } }
      }
    }`,
    {},
    { revalidate: 3600 }
  );
  return data?.localization ?? null;
}

// The store's accepted card brands and digital wallets (Shopify's codes: VISA, MASTERCARD, SHOPIFY_PAY, …),
// as Liquid's shop.enabled_payment_types: the footer's payment icons
export async function getPaymentMethods() {
  const data = await storefront(
    `#graphql
    query PaymentMethods {
      shop { paymentSettings { acceptedCardBrands supportedDigitalWallets } }
    }`,
    {},
    { revalidate: 3600 }
  );
  const settings = data?.shop.paymentSettings;
  return [...(settings?.acceptedCardBrands ?? []), ...(settings?.supportedDigitalWallets ?? [])];
}

// A store policy (/policies/<handle>: privacy-policy, refund-policy, shipping-policy, terms-of-service)
export async function getPolicy(handle) {
  const data = await storefront(
    `#graphql
    query Policies {
      shop {
        privacyPolicy { title handle body }
        refundPolicy { title handle body }
        shippingPolicy { title handle body }
        termsOfService { title handle body }
      }
    }`
  );
  const policy = Object.values(data?.shop ?? {}).find((item) => item?.handle === handle);
  return policy ? policyTitled(policy) : null;
}

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

// Collections picked in a theme setting (handles), in that order, as collection cards
export async function getCollectionsByHandles(handles = []) {
  if (!handles.length) return [];
  const fields = handles.map((handle, index) => `c${index}: collection(handle: ${JSON.stringify(handle)}) { ${COLLECTION_CARD} }`);
  const data = await storefront(`query PickedCollections { ${fields.join('\n')} }`);
  return handles
    .map((_, index) => data?.[`c${index}`])
    .filter(Boolean)
    .map(withProductsCount);
}

// A product with its images and every variant: the quick view
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
        options(first: 10) { ${OPTION} }
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
        allOptions: options(first: 10) { ${OPTION} }
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

// A collection's products for a product list (24, sorted, after the cursor of the previous page).
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
  const fields = `handle title articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) { nodes { ${ARTICLE} } }`;
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

// Every product, collection, page, blog and article URL with its last update, for sitemap.xml (250 each,
// the API's page size)
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
