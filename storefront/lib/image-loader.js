// next/image loader: Shopify's CDN resizes by the `width` query parameter
export default function shopifyLoader({ src, width }) {
  const url = new URL(src);
  url.searchParams.set('width', width);
  return url.href;
}
