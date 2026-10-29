// Search engines and link previews, as the theme does them:
// - pageMetadata: theme/snippets/meta-tags.liquid — title, description (the store's as fallback),
//   canonical, robots (noindex for search / filtered lists / personal pages, large image previews
//   elsewhere), Open Graph and Twitter cards (Theme settings > Social sharing image as fallback).
//   Next.js merges metadata one key deep, so every page gets the full set from here;
// - organization / website / collectionPage: theme/snippets/structured-data.liquid (JSON-LD).
// Absolute URLs from SITE_URL (the layout's metadataBase).
import { sizedUrl } from '@/components/ThemeImage.js';
import { SITE_URL } from './env.js';
import { getPage, getShell } from './queries.js';
import { getSettings, imageUrl } from './theme.js';

const INDEX = { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 };
const NOINDEX = { index: false, follow: true };

const SHOP_URL = `${SITE_URL}/`;
const ORG_ID = `${SHOP_URL}#organization`;
const SOCIAL = ['instagram', 'facebook', 'tiktok', 'youtube', 'telegram', 'pinterest'];

// The Social sharing image, 1200px wide (meta-tags: og:image)
async function shareImage() {
  const url = await imageUrl(getSettings().share_image);
  return url ? { url: sizedUrl(url, 1200), width: 1200 } : null;
}

// image: { url, width?, height? } of the page (a product's, an article's); the sharing image otherwise
export async function pageMetadata({ title, description, path, type = 'website', image, noindex = false }) {
  const { shop } = await getShell();
  const text = description || shop.description || shop.name;
  const picture = image ?? (await shareImage());
  const heading = title || shop.name;
  return {
    ...(title && { title }),
    description: text,
    ...(path && { alternates: { canonical: path } }),
    robots: noindex ? NOINDEX : INDEX,
    openGraph: {
      siteName: shop.name,
      title: heading,
      description: text,
      ...(path && { url: path }),
      type,
      locale: 'en',
      ...(picture && { images: [picture] }),
    },
    twitter: { card: 'summary_large_image', title: heading, description: text },
  };
}

// Every page: the store — logo, contacts, social profiles; with Theme settings > Search engines > country,
// the return and shipping policies Google shows next to products
export async function organization() {
  const settings = getSettings();
  const [{ shop }, logo, returnsPage] = await Promise.all([getShell(), imageUrl(settings.logo), getPage('shipping-returns')]);
  const sameAs = SOCIAL.map((name) => settings[`social_${name}`]).filter(Boolean);
  const contacts = {
    ...(settings.store_phone && { telephone: settings.store_phone }),
    ...(settings.store_email && { email: settings.store_email }),
  };
  const country = (settings.seo_country ?? '').trim().toUpperCase();
  const currency = shop.paymentSettings?.currencyCode;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: shop.name,
    url: SHOP_URL,
    ...(logo && { logo: sizedUrl(logo, 600) }),
    ...(shop.description && { description: shop.description }),
    ...contacts,
    ...(Object.keys(contacts).length > 0 && { contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', ...contacts } }),
    ...(settings.store_address && { address: settings.store_address.split(/\r?\n/).join(', ') }),
    ...(sameAs.length > 0 && { sameAs }),
    ...(country.length === 2 && currency && policies(settings, country, currency, returnsPage)),
  };
}

function policies(settings, country, currency, returnsPage) {
  const category =
    { none: 'MerchantReturnNotPermitted', unlimited: 'MerchantReturnUnlimitedWindow' }[settings.seo_return_policy] ??
    'MerchantReturnFiniteReturnWindow';
  const rate = Number(settings.seo_shipping_rate) || 0;
  const freeFrom = Number(settings.seo_free_shipping_from) || 0;
  const days = (min, max) => ({
    '@type': 'ServicePeriod',
    duration: { '@type': 'QuantitativeValue', minValue: min, maxValue: max, unitCode: 'DAY' },
  });
  const transit = days(settings.seo_transit_min ?? 2, settings.seo_transit_max ?? 5);
  const destination = { '@type': 'DefinedRegion', addressCountry: country };
  const money = (fields) => ({ '@type': 'MonetaryAmount', ...fields, currency });
  const conditions = [
    {
      '@type': 'ShippingConditions',
      shippingDestination: destination,
      ...(freeFrom > 0 && { orderValue: money({ minValue: 0, maxValue: freeFrom - 0.01 }) }),
      shippingRate: money({ value: rate }),
      transitTime: transit,
    },
    ...(freeFrom > 0
      ? [
          {
            '@type': 'ShippingConditions',
            shippingDestination: destination,
            orderValue: money({ minValue: freeFrom }),
            shippingRate: money({ value: 0 }),
            transitTime: transit,
          },
        ]
      : []),
  ];
  return {
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: country,
      returnPolicyCategory: `https://schema.org/${category}`,
      ...(category === 'MerchantReturnFiniteReturnWindow' && { merchantReturnDays: settings.seo_return_days ?? 14 }),
      ...(category !== 'MerchantReturnNotPermitted' && {
        returnMethod: 'https://schema.org/ReturnByMail',
        returnFees: `https://schema.org/${settings.seo_free_returns ? 'FreeReturn' : 'ReturnFeesCustomerResponsibility'}`,
        refundType: 'https://schema.org/FullRefund',
      }),
      ...(returnsPage && { merchantReturnLink: `${SITE_URL}/pages/shipping-returns` }),
    },
    hasShippingService: {
      '@type': 'ShippingService',
      fulfillmentType: 'https://schema.org/FulfillmentTypeDelivery',
      handlingTime: days(0, settings.seo_handling_days ?? 2),
      shippingConditions: conditions,
    },
  };
}

// Home page: the site with its search (the options every store search carries: snippets/search-options)
export async function website() {
  const { shop } = await getShell();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SHOP_URL}#website`,
    name: shop.name,
    url: SHOP_URL,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}&type=product&options%5Bprefix%5D=last&options%5Bunavailable_products%5D=last`,
      'query-input': 'required name=search_term_string',
    },
  };
}

// A collection and its first products: what the page lists
export function collectionPage(collection, products, count) {
  const url = `${SITE_URL}/collections/${collection.handle}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#collection`,
    url,
    name: collection.title,
    ...(collection.description && { description: collection.description.split(/\s+/).slice(0, 50).join(' ') }),
    isPartOf: { '@id': `${SHOP_URL}#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: count,
      itemListElement: products.slice(0, 12).map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${SITE_URL}/products/${product.handle}`,
        name: product.title,
      })),
    },
  };
}
