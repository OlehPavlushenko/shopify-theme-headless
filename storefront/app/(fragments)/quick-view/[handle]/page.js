// The quick view of a product for @ui/quick-view (data-endpoint="/quick-view"): theme/sections/quick-view.liquid —
// images in a slider, vendor, title, live price, the linked variant picker and the add button
// (<cart-item-state>: "− 2 in cart +" once the picked variant is in the cart), "View details".
// <product-info> (@ui/variant-picker) keeps price, button and form in step with the picks.
import { notFound } from 'next/navigation';
import Icon from '@/components/Icon.js';
import Image from 'next/image';
import Price from '@/components/Price.js';
import VariantPickerInputs, { numericId } from '@/components/VariantPickerInputs.js';
import { moneyFormat } from '@/lib/format.js';
import { getProductWithVariants } from '@/lib/queries.js';
import { getSettings, t } from '@/lib/theme.js';

export default async function QuickView({ params }) {
  const product = await getProductWithVariants(decodeURIComponent((await params).handle));
  if (!product) notFound();
  const variant = product.selectedOrFirstAvailableVariant ?? product.variants.nodes[0];
  const images = product.images.nodes;
  const single = product.variants.nodes.length === 1 && product.options[0]?.optionValues[0]?.name === 'Default Title';
  const sale = variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount);
  const discount = sale ? Math.round((1 - Number(variant.price.amount) / Number(variant.compareAtPrice.amount)) * 100) : 0;
  const inCartLabel = t('products.in_cart', { count: '%n' });
  const currency = variant.price.currencyCode;

  return (
    <product-info
      class="quick-view"
      data-money-format={moneyFormat(currency)}
      data-label-add={t('products.add_to_cart')}
      data-label-sold-out={t('products.sold_out')}
      data-label-unavailable={t('products.unavailable')}
    >
      <ui-slider class="slider quick-view__media" style={{ '--slider-columns': 1, '--slider-columns-mobile': 1 }}>
        <ul className="scroll-track slider__track quick-view__track" data-slider-track role="list">
          {images.map((image) => (
            <li key={image.id} className="frame quick-view__image" style={{ '--frame-ratio': 1 }} data-media-id={numericId(image.id)}>
              <Image
                src={image.url}
                alt={image.altText || product.title}
                width={image.width}
                height={image.height}
                sizes="(min-width: 750px) 45vw, 90vw"
              />
            </li>
          ))}
        </ul>
        <span className="pill quick-view__badge" data-discount-badge hidden={!sale}>
          −{discount}%
        </span>
        {images.length > 1 && <div className="slider__dots quick-view__dots" data-slider-dots data-label={t('sections.hero.slide')} />}
      </ui-slider>

      <div className="quick-view__info">
        {product.vendor && <p className="product-card__vendor">{product.vendor}</p>}
        <h2 className="h4 quick-view__title">{product.title}</h2>
        <Price price={variant.price} compareAt={variant.compareAtPrice} live className="quick-view__price" />

        {!single && <VariantPickerInputs product={product} selected={variant} id="QuickView" />}

        <cart-item-state
          class="product-card__cart quick-view__cart"
          data-variant-id={variant.id}
          data-label={inCartLabel}
          data-open-drawer={getSettings().cart_type === 'drawer' ? '' : undefined}
        >
          <ajax-cart-product-form data-product-form>
            <form className="quick-view__form">
              <input type="hidden" name="id" value={numericId(variant.id)} />
              <button type="submit" className="btn btn--full" data-add-button disabled={!variant.availableForSale}>
                <span data-add-label>{variant.availableForSale ? t('products.add_to_cart') : t('products.sold_out')}</span>
              </button>
            </form>
          </ajax-cart-product-form>
          <div className="product-card__in-cart">
            <button type="button" className="product-card__step" data-step="-1" aria-label={t('cart.decrease', { product: product.title })}>
              <Icon name="minus" />
            </button>
            <span className="product-card__in-cart-label" data-in-cart-label aria-live="polite">
              {inCartLabel.replace('%n', 0)}
            </span>
            <button type="button" className="product-card__step" data-step="1" aria-label={t('cart.increase', { product: product.title })}>
              <Icon name="plus" />
            </button>
          </div>
        </cart-item-state>

        <a href={`/products/${product.handle}`} className="link-arrow quick-view__link" data-product-link>
          {t('products.view_details')}
          <Icon name="arrow-right" />
        </a>
      </div>
    </product-info>
  );
}
