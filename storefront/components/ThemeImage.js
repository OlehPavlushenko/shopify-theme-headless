// A theme image setting (shopify://shop_images/…) as a responsive <img> from Shopify's CDN — the theme's
// `image_url | image_tag: widths:, sizes:`. Nothing when the setting is blank.
import { imageUrl } from '@/lib/theme.js';

export default async function ThemeImage({
  image,
  widths = [400, 800, 1200],
  sizes,
  alt = '',
  className,
  loading = 'lazy',
  fetchPriority,
  width,
}) {
  const src = await imageUrl(image);
  if (!src) return null;
  const at = (width) => `${src}${src.includes('?') ? '&' : '?'}width=${width}`;
  return (
    <img
      className={className}
      width={width}
      src={at(widths.at(-1))}
      srcSet={widths.map((width) => `${at(width)} ${width}w`).join(', ')}
      sizes={sizes}
      alt={alt}
      loading={loading}
      fetchPriority={fetchPriority}
    />
  );
}
