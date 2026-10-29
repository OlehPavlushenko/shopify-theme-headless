// Product card: the same markup as theme/snippets/product-card.liquid (styles: packages/ui/css/product-card.css),
// with Theme settings > Product cards: image shape and fit, second image on hover, label, vendor, rating,
// option values, offer timer. Badge: sold out / "Offer" (metafield custom.offer_ends ahead) / "−X%" / sale /
// the product's label (custom.label). The first option's values on one line: color swatches (5 at most,
// then "+N") or text, unavailable ones marked. quickAdd: QuickAdd under the price. actions: the wishlist /
// compare buttons over the image (off in small cards: menus, search, cart).
// Data: the ProductCard fragment (lib/queries.js).
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import Countdown from './Countdown.js';
import Price from './Price.js';
import QuickAdd from './QuickAdd.js';
import Rating from './Rating.js';
import SavedToggles from './SavedToggles.js';
import Swatch, { isColorOption } from './Swatch.js';
import { getSettings, t } from '@/lib/theme.js';

const SIZES = '(min-width: 990px) calc((100vw - 10rem) / 4), (min-width: 750px) calc((100vw - 6rem) / 3), calc((100vw - 4rem) / 2)';

function discountPercent(price, compareAt) {
  if (!compareAt || Number(compareAt.amount) <= Number(price.amount)) return 0;
  return Math.round((1 - Number(price.amount) / Number(compareAt.amount)) * 100);
}

// The first option's values: swatches (snippets/swatch: Shopify's swatch, else the name as a CSS color) or text
function OptionValues({ product }) {
  const option = product.options[0];
  const swatches = isColorOption(option);
  const shown = swatches ? 5 : 50;
  const available = (name) =>
    product.variants.nodes.some(
      (variant) => variant.availableForSale && variant.selectedOptions.some((o) => o.name === option.name && o.value === name)
    );
  return (
    <ul className={`product-card__values${swatches ? ' product-card__values--swatches' : ''}`} role="list" aria-label={option.name}>
      {option.optionValues.slice(0, shown).map((value) => (
        <li key={value.name} className={`product-card__value${available(value.name) ? '' : ' product-card__value--unavailable'}`}>
          {swatches ? <Swatch value={value} /> : <span>{value.name}</span>}
        </li>
      ))}
      {option.optionValues.length > shown && (
        <li className="product-card__value product-card__value--more">+{option.optionValues.length - shown}</li>
      )}
    </ul>
  );
}

export default function ProductCard({
  product,
  eager = false,
  headingTag: Heading = 'h3',
  showVendor = false,
  secondImage = true,
  quickAdd = false,
  actions = true,
  sizes = SIZES,
}) {
  const settings = getSettings();
  const image = product.featuredImage;
  const second = secondImage && settings.card_secondary_image !== false ? product.images.nodes[1] : null;
  const variant = product.selectedOrFirstAvailableVariant;
  const discount = variant ? discountPercent(variant.price, variant.compareAtPrice) : 0;
  const onSale =
    !discount && Number(product.compareAtPriceRange.maxVariantPrice.amount) > Number(product.priceRange.minVariantPrice.amount);
  const differentPrices = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const single = product.variants.nodes.length === 1 && product.options[0]?.optionValues[0]?.name === 'Default Title';
  const offerEnds = product.offerEnds?.value;
  const offerActive = offerEnds && new Date(offerEnds).getTime() > Date.now();
  const url = `/products/${product.handle}`;
  // Image shape: a ratio, or the first image's own
  let ratio = settings.card_image_ratio || '1';
  if (ratio === 'natural') ratio = image ? image.width / image.height : 1;

  let badge = null;
  if (!product.availableForSale) badge = <span className="pill pill--soft product-card__badge">{t('products.sold_out')}</span>;
  else if (offerActive) badge = <span className="pill pill--offer product-card__badge">{t('products.offer.badge')}</span>;
  else if (discount > 0) badge = <span className="pill product-card__badge">−{discount}%</span>;
  else if (onSale) badge = <span className="pill product-card__badge">{t('products.sale')}</span>;
  else if (settings.card_show_label && product.label?.value)
    badge = <span className="pill pill--soft product-card__badge">{product.label.value}</span>;

  const imageProps = { width: image?.width, height: image?.height, sizes };
  return (
    <article className={`product-card${second ? ' product-card--hover' : ''}`}>
      <div
        className="product-card__media frame"
        style={{ '--frame-ratio': ratio, ...(settings.card_image_fit === 'contain' && { '--frame-fit': 'contain' }) }}
      >
        {image && (
          <Image
            className="product-card__image"
            src={image.url}
            alt={image.altText || product.title}
            {...imageProps}
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager ? 'high' : undefined}
          />
        )}
        {second && (
          <Image
            className="product-card__image product-card__image--secondary"
            src={second.url}
            alt=""
            {...imageProps}
            width={second.width}
            height={second.height}
          />
        )}
      </div>

      {/* One link over the whole card; buttons inside the card sit above it */}
      <Link href={url} className="product-card__overlay" aria-label={product.title} />

      {actions && <SavedToggles product={product} className="product-card__actions" />}

      {badge}

      <div className="product-card__info">
        {(showVendor || settings.card_show_vendor) && product.vendor && <p className="product-card__vendor">{product.vendor}</p>}
        <Heading className="product-card__title line-clamp">{product.title}</Heading>
        {settings.card_show_rating !== false && <Rating product={product} className="product-card__rating" />}
        <Price
          price={differentPrices ? product.priceRange.minVariantPrice : (variant?.price ?? product.priceRange.minVariantPrice)}
          compareAt={variant?.compareAtPrice}
          from={differentPrices}
        />
        {product.availableForSale && settings.card_show_timer !== false && offerActive && (
          <p className="offer-timer product-card__offer" data-countdown-section>
            <Icon name="clock" />
            <Countdown end={offerEnds} labelText={t('products.offer.expires_in')} />
          </p>
        )}
        {!single && settings.card_show_options !== false && product.options[0] && <OptionValues product={product} />}
      </div>

      {quickAdd && product.availableForSale && variant && <QuickAdd product={product} variantId={variant.id} single={single} />}
    </article>
  );
}
