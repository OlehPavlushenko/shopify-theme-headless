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
