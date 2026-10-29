// A theme image setting (shopify://shop_images/…) as a responsive <img> from Shopify's CDN — the theme's
// `image_url | image_tag: widths:, sizes:`. Nothing when the setting is blank.
import { preload } from 'react-dom';
import { imageUrl } from '@/lib/theme.js';

// A Shopify CDN file at a width (image_url: width:)
export const sizedUrl = (src, width) => `${src}${src.includes('?') ? '&' : '?'}width=${width}`;

// srcset of a CDN file at the given widths
export const srcSetOf = (src, widths) => widths.map((width) => `${sizedUrl(src, width)} ${width}w`).join(', ');

export default async function ThemeImage({
  image,
  widths = [400, 800, 1200],
  sizes,
  alt = '',
  className,
  loading = 'lazy',
  fetchPriority,
  width,
  height,
}) {
  const src = await imageUrl(image);
  if (!src) return null;
  // The page's main image (fetchPriority high, as image_tag preload: true): preloaded from the <head>
  if (fetchPriority === 'high') {
    preload(sizedUrl(src, widths.at(-1)), { as: 'image', imageSrcSet: srcSetOf(src, widths), imageSizes: sizes, fetchPriority: 'high' });
  }
  return (
    <img
      className={className}
      width={width}
      height={height}
      src={sizedUrl(src, widths.at(-1))}
      srcSet={srcSetOf(src, widths)}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}
