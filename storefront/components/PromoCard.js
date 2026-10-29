// Promo card: theme/snippets/promo-card.liquid — one link, image and text stacked or text over the image.
// image: a theme image value (shopify://shop_images/…). Styles: packages/ui/css/promo.css.
import Link from 'next/link';
import Icon from './Icon.js';
import ThemeImage from './ThemeImage.js';
import { linkUrl } from '@/lib/links.js';

export default function PromoCard({
  url,
  image,
  eyebrow,
  heading,
  text,
  linkLabel,
  layout,
  ratio = '4 / 3',
  sizes = '(min-width: 990px) 33vw, 100vw',
}) {
  return (
    <Link href={linkUrl(url) || '/'} className={`promo-card promo-card--${layout || 'stacked'}`}>
      <span className="promo-card__media frame" style={{ '--frame-ratio': ratio }}>
        <ThemeImage image={image} widths={[400, 600, 800, 1200]} sizes={sizes} />
      </span>
      <span className="promo-card__body">
        {eyebrow && <span className="eyebrow promo-card__eyebrow">{eyebrow}</span>}
        {heading && <span className="promo-card__heading">{heading}</span>}
        {text && <span className="promo-card__text">{text}</span>}
        {linkLabel && (
          <span className="link-arrow promo-card__cta">
            {linkLabel}
            <Icon name="arrow-right" />
          </span>
        )}
      </span>
    </Link>
  );
}
