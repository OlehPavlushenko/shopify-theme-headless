// The product page's data: what sections/main-product and its neighbours read from the product object —
// media (images, videos), options and every variant (the picker's JSON), the picked variant (?Option=Value
// or ?variant=<id>), the theme's metafields (label, rating, offer end, bundle offer, key ingredients, how
// to use), collections, type and vendor.
import { storefront } from './shopify.js';
import { PRODUCT_CARD } from './queries.js';

const IMAGE = 'url altText width height';
const MONEY = 'amount currencyCode';

export async function getProductPage(handle, selectedOptions = []) {
  const data = await storefront(
    `#graphql
    query ProductPage($handle: String!, $selectedOptions: [SelectedOptionInput!]!) {
      product(handle: $handle) {
        id
        handle
        title
        vendor
        productType
        description
        descriptionHtml
        availableForSale
        seo { title description }
        featuredImage { ${IMAGE} }
        media(first: 30) {
          nodes {
            mediaContentType
            alt
            previewImage { ${IMAGE} }
            ... on MediaImage { image { id ${IMAGE} } }
            ... on Video { id sources { url mimeType height } }
            ... on ExternalVideo { id embedUrl }
          }
        }
        options(first: 10) { name optionValues { name swatch { color image { previewImage { url } } } } }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            selectedOptions { name value }
            price { ${MONEY} }
            compareAtPrice { ${MONEY} }
            image { id }
          }
        }
        selectedOrFirstAvailableVariant(selectedOptions: $selectedOptions, ignoreUnknownOptions: true, caseInsensitiveMatch: true) {
          id
          title
          sku
          availableForSale
          selectedOptions { name value }
          price { ${MONEY} }
          compareAtPrice { ${MONEY} }
          image { id }
        }
        collections(first: 6) { nodes { handle title } }
        label: metafield(namespace: "custom", key: "label") { value }
        rating: metafield(namespace: "reviews", key: "rating") { value }
        ratingCount: metafield(namespace: "reviews", key: "rating_count") { value }
        offerEnds: metafield(namespace: "custom", key: "offer_ends") { value }
        bundleOffer: metafield(namespace: "custom", key: "bundle_offer") { value }
        keyIngredients: metafield(namespace: "custom", key: "key_ingredients") { value }
        howToUse: metafield(namespace: "custom", key: "how_to_use") { value }
      }
    }`,
    { handle, selectedOptions }
  );
  return data?.product ?? null;
}

// "Pairs well with": Search & Discovery's complementary products, and Shopify's related ones
export async function getProductRecommendations(handle, intent) {
  const data = await storefront(
    `#graphql
    query ProductRecommendations($handle: String!, $intent: ProductRecommendationIntent!) {
      productRecommendations(productHandle: $handle, intent: $intent) { ...ProductCard }
    }
    ${PRODUCT_CARD}`,
    { handle, intent },
    { revalidate: 3600 }
  );
  return data?.productRecommendations ?? [];
}

// A list metafield (list.single_line_text_field) as an array
export function listValue(metafield) {
  try {
    const value = JSON.parse(metafield?.value ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}
