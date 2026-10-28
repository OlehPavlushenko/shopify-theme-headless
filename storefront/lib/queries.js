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
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
    }
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

// The cart (per visitor: never cached)
export const CART = `#graphql
  fragment Cart on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { ${MONEY} } totalAmount { ${MONEY} } }
    lines(first: 100) {
      nodes {
        id
        quantity
        cost { totalAmount { ${MONEY} } compareAtAmountPerQuantity { ${MONEY} } }
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
