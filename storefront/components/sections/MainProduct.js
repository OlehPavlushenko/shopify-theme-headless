// theme/sections/main-product.liquid: the same markup in one <product-info> (@ui/variant-picker) — the head
// (label, h1), the gallery (grid / thumbnails / stacked; a slider on phones) with zoom, the info blocks in
// the editor's order, the lightbox and the sticky buy bar. Behavior: @ui/product (gallery, quantity,
// sticky bar, delivery estimate, back-in-stock, share, recommendations, recently viewed). Adding to the cart:
// <cart-item-state> (lib/cart-elements.js) around the form. context.product: lib/product.js getProductPage.
import { Fragment } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../Breadcrumbs.js';
import CloseButton from '../CloseButton.js';
import ContactForm from '../ContactForm.js';
import Countdown from '../Countdown.js';
import Icon from '../Icon.js';
import Popup from '../Popup.js';
import Price from '../Price.js';
import ProductRow from '../ProductRow.js';
import Rating from '../Rating.js';
import SavedToggles from '../SavedToggles.js';
import VariantPickerInputs from '../VariantPickerInputs.js';
import { SITE_URL } from '@/lib/env.js';
import { discountOf, formatMoney, moneyFormat } from '@/lib/format.js';
import { hasOnlyDefaultVariant, numericId } from '@/lib/ids.js';
import { getProductRecommendations } from '@/lib/product.js';
import { getPage } from '@/lib/queries.js';
import { getSettings, t } from '@/lib/theme.js';

const MEDIA_SIZES = { grid: '(min-width: 990px) 28vw, 100vw', stacked: '(min-width: 990px) 55vw, 100vw' };

// The vendor's and the type's products: Shopify's automatic collections, as link_to_vendor / link_to_type
const vendorUrl = (vendor) => `/collections/vendors?q=${encodeURIComponent(vendor)}`;
const typeUrl = (type) => `/collections/types?q=${encodeURIComponent(type)}`;

// The product with the picked variant ("Cream / 50 ml"), as the forms send it (back in stock, ask a question)
const variantLabel = (product, variant) => (hasOnlyDefaultVariant(product) ? product.title : `${product.title} / ${variant.title}`);

function Gallery({ product, layout, ratio, discount }) {
  const media = product.media.nodes;
  const sizes = MEDIA_SIZES[layout] ?? '(min-width: 990px) 50vw, 100vw';
  return (
    <product-gallery class={`product-gallery product-gallery--${layout} sticky-column`} data-layout={layout}>
      <ul className="scroll-track product-gallery__track" role="list" data-gallery-track="">
        {media.map((item, index) => {
          const image = item.image ?? item.previewImage;
          const id = item.image ? numericId(item.image.id) : numericId(item.id ?? index);
          const kind = { IMAGE: 'image', VIDEO: 'video', EXTERNAL_VIDEO: 'external_video' }[item.mediaContentType] ?? 'model';
          return (
            <li key={id} className={`product-gallery__item product-gallery__item--${kind}`} data-media-id={id} data-index={index}>
              {kind === 'image' ? (
                <button
                  type="button"
                  className="frame product-gallery__zoom"
                  style={{ '--frame-ratio': ratio }}
                  data-zoom={index}
                  aria-label={t('products.zoom', { index: index + 1 })}
                >
                  <Image
                    src={image.url}
                    alt={item.alt || product.title}
                    width={image.width}
                    height={image.height}
                    sizes={sizes}
                    {...(index === 0 ? { preload: true } : { loading: 'lazy' })}
                  />
                  <span className="product-gallery__zoom-icon" aria-hidden="true">
                    <Icon name="zoom" />
                  </span>
                </button>
              ) : kind === 'video' ? (
                <div className="frame product-gallery__video" style={{ '--frame-ratio': ratio }}>
                  <video controls muted playsInline loop preload="none" poster={image ? `${image.url}&width=1200` : undefined}>
                    {item.sources.map((source) => (
                      <source key={source.url} src={source.url} type={source.mimeType} />
                    ))}
                  </video>
                </div>
              ) : kind === 'external_video' ? (
                <div className="frame product-gallery__video" style={{ '--frame-ratio': '16 / 9' }}>
                  <iframe
                    src={item.embedUrl}
                    title={item.alt || product.title}
                    loading="lazy"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="frame" style={{ '--frame-ratio': ratio }}>
                  {image && (
                    <Image src={image.url} alt={item.alt || product.title} width={image.width} height={image.height} sizes={sizes} />
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {media.length > 1 && (
        <>
          <p className="product-gallery__counter" aria-hidden="true">
            <span data-gallery-current="">1</span> / {media.length}
          </p>
          {layout === 'thumbnails' && (
            <ul className="product-gallery__thumbs" role="list">
              {media.map((item, index) => {
                const image = item.image ?? item.previewImage;
                return (
                  <li key={index}>
                    <button
                      type="button"
                      className="frame product-gallery__thumb"
                      style={{ '--frame-ratio': 1 }}
                      data-thumb={index}
                      aria-label={t('products.show_media', { index: index + 1 })}
                      aria-current={index === 0 ? 'true' : undefined}
                    >
                      {image && <Image src={image.url} alt="" width={image.width} height={image.height} sizes="80px" />}
                      {item.mediaContentType.includes('VIDEO') && (
                        <span className="product-gallery__thumb-play" aria-hidden="true">
                          <Icon name="play" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
      <span className="pill product-gallery__badge" data-discount-badge="" hidden={!discount}>
        {discount ? `−${discount}%` : ''}
      </span>
    </product-gallery>
  );
}

function QuantityInput({ className, name, title, sticky }) {
  return (
    <quantity-input class={`qty ${className}`}>
      <button type="button" className="qty__btn" data-qty="-1" aria-label={t('cart.decrease', { product: title })}>
        <Icon name="minus" />
      </button>
      <input
        className="qty__input"
        type="number"
        name={name}
        defaultValue={1}
        min="1"
        inputMode="numeric"
        aria-label={t('cart.quantity')}
        data-sticky-qty={sticky ? '' : undefined}
      />
      <button type="button" className="qty__btn" data-qty="1" aria-label={t('cart.increase', { product: title })}>
        <Icon name="plus" />
      </button>
    </quantity-input>
  );
}

function BuyButtons({ block, product, variant, formId, sectionId }) {
  const s = block.settings;
  const theme = getSettings();
  const state = variant.availableForSale ? 'in' : 'out';
  const labels = { in: t('products.stock_in'), low: t('products.stock_low', { count: '%n' }), out: t('products.sold_out') };
  return (
    <div className="main-product__buy">
      {s.show_stock && (
        <p className="main-product__stock" data-stock="" data-state={state} data-in={labels.in} data-low={labels.low} data-out={labels.out}>
          <span className="main-product__stock-dot" aria-hidden="true" />
          <span data-stock-label="">{labels[state]}</span>
        </p>
      )}
      <cart-item-state data-variant-id={variant.id} data-open-drawer={theme.cart_type === 'drawer' ? '' : undefined}>
        <ajax-cart-product-form data-product-form="">
          <form id={formId} className="main-product__form" noValidate>
            <input type="hidden" name="id" value={numericId(variant.id)} />
            <div className="main-product__actions">
              {s.show_quantity && <QuantityInput className="main-product__qty" name="quantity" title={product.title} />}
              <button type="submit" className="btn btn--lg main-product__add" data-add-button="" disabled={!variant.availableForSale}>
                <span data-add-label="">{variant.availableForSale ? t('products.add_to_cart') : t('products.sold_out')}</span>
              </button>
              {(theme.wishlist_enabled || theme.compare_enabled) && <SavedToggles product={product} className="main-product__saved" />}
            </div>
            {s.show_dynamic_checkout && (
              <div className="main-product__checkout">
                {/* The markup of Shopify's unbranded dynamic checkout button in the theme ("Buy it now" is its own text) */}
                <div className="shopify-payment-button">
                  <button
                    type="button"
                    className="shopify-payment-button__button shopify-payment-button__button--unbranded"
                    data-buy-now=""
                  >
                    Buy it now
                  </button>
                </div>
              </div>
            )}
            <div className="main-product__terms" />
          </form>
        </ajax-cart-product-form>
      </cart-item-state>
      <cart-item-state class="main-product__in-cart" data-variant-id={variant.id} data-label={t('products.in_cart_note', { count: '%n' })}>
        <Icon name="check" />
        <span data-in-cart-label="" />
        <a href="/cart" data-dialog-open={theme.cart_type === 'drawer' ? 'CartDrawer' : undefined}>
          {t('cart.view_cart')}
        </a>
      </cart-item-state>
      {s.show_notify && (
        <stock-notify class="stock-notify" hidden={variant.availableForSale}>
          <ContactForm
            path="notify"
            action="notify"
            formClass="stock-notify__form"
            messageError={t('products.notify.error')}
            success={t('products.notify.success')}
            fields={
              <>
                <p className="stock-notify__title">
                  <Icon name="mail" />
                  {t('products.notify.title')}
                </p>
                <p className="stock-notify__text">{t('products.notify.text')}</p>
                <variant-fields data-product={product.title}>
                  <input type="hidden" name="variant" value={numericId(variant.id)} data-variant-id="" />
                  <input type="hidden" name="product" value={variantLabel(product, variant)} data-variant-title="" />
                </variant-fields>
                <p className="form-errors" role="alert" data-contact-message="" />
                <div className="search-form stock-notify__row">
                  <label className="visually-hidden" htmlFor={`Notify-${sectionId}`}>
                    {t('contact.email')}
                  </label>
                  <input
                    className="input"
                    type="email"
                    id={`Notify-${sectionId}`}
                    name="email"
                    autoComplete="email"
                    spellCheck="false"
                    placeholder={t('newsletter.placeholder')}
                    required
                  />
                  <button type="submit" className="btn">
                    {t('products.notify.submit')}
                  </button>
                </div>
              </>
            }
          />
        </stock-notify>
      )}
    </div>
  );
}

function QuantityBreaks({ block, variant, formId, sectionId, hasStepper }) {
  const s = block.settings;
  const popular = Number(s.popular);
  const tiers = [1, 2, 3].map((i) => ({ i, qty: s[`qty_${i}`], off: s[`discount_${i}`] })).filter((tier) => tier.qty > 0);
  return (
    <quantity-breaks class="quantity-breaks" data-form={formId}>
      <fieldset className="quantity-breaks__group">
        <legend className="quantity-breaks__legend">{s.heading}</legend>
        {tiers.map((tier, index) => (
          <label key={tier.i} className="quantity-breaks__option">
            <input
              className="quantity-breaks__input"
              type="radio"
              name={hasStepper ? `quantity-break-${sectionId}` : 'quantity'}
              form={hasStepper ? undefined : formId}
              value={tier.qty}
              data-discount={tier.off}
              defaultChecked={index === 0}
            />
            {popular === tier.i && <span className="pill quantity-breaks__badge">{t('products.quantity_breaks.popular')}</span>}
            <span className="quantity-breaks__title">{t('products.quantity_breaks.items', { count: tier.qty })}</span>
            <span className="quantity-breaks__save">
              {tier.off > 0 ? t('products.quantity_breaks.save', { percent: tier.off }) : t('products.quantity_breaks.standard')}
            </span>
            <span className="quantity-breaks__price">
              <span data-break-each="">
                {formatMoney({
                  amount: Math.floor((100 - tier.off) * Number(variant.price.amount)) / 100,
                  currencyCode: variant.price.currencyCode,
                })}
              </span>
              {tier.qty > 1 && <span className="quantity-breaks__unit">{t('products.quantity_breaks.each')}</span>}
            </span>
          </label>
        ))}
      </fieldset>
    </quantity-breaks>
  );
}

async function InfoLinks({ block, product, variant }) {
  const s = block.settings;
  const askProduct = variantLabel(product, variant);
  const pages = await Promise.all([1, 2, 3].map((i) => (s[`page_${i}`] && s[`label_${i}`] ? getPage(s[`page_${i}`]) : null)));
  const askId = `Ask-${block.id}`;
  return (
    <div className="info-links">
      {pages.map((page, index) => {
        if (!page) return null;
        const i = index + 1;
        const popupId = `Info-${block.id}-${i}`;
        return (
          <Fragment key={i}>
            <a href={`/pages/${page.handle}`} className="btn btn--link info-links__link" data-dialog-open={page.body ? popupId : undefined}>
              <Icon name={s[`icon_${i}`]} />
              {s[`label_${i}`]}
            </a>
            {page.body && (
              <Popup id={popupId} title={page.title}>
                <div className="popup__body rte" dangerouslySetInnerHTML={{ __html: page.body }} />
              </Popup>
            )}
          </Fragment>
        );
      })}
      {s.show_ask && getSettings().api_url && (
        <>
          <button type="button" className="btn btn--link info-links__link" data-dialog-open={askId}>
            <Icon name="chat" />
            {t('products.ask.title')}
          </button>
          <Popup id={askId} title={t('products.ask.title')}>
            <div className="popup__body">
              <ContactForm
                formId={`${askId}-form`}
                formClass="ask-form"
                idPrefix={askId}
                messageLabel={t('products.ask.question')}
                rows={5}
                intro={
                  <variant-fields data-product={product.title}>
                    <p className="ask-form__about">
                      {t('products.ask.about')} <strong data-variant-title="">{askProduct}</strong>
                    </p>
                    <input type="hidden" name="subject" value={askProduct} data-variant-title="" />
                  </variant-fields>
                }
              />
            </div>
          </Popup>
        </>
      )}
    </div>
  );
}

async function Collapsible({ block, product }) {
  const s = block.settings;
  let body = s.content;
  if (s.source === 'description') body = product.descriptionHtml;
  else if (s.source === 'page') body = s.page ? (await getPage(s.page))?.body : '';
  else if (s.source === 'metafield') body = '';
  if (!body) return null;
  return (
    <details className="accordion main-product__accordion" open={s.open}>
      <summary className="accordion__summary">
        <span className="accordion__title">
          {s.icon !== 'none' && <Icon name={s.icon} />}
          {s.heading}
        </span>
        <span className="accordion__icon" aria-hidden="true">
          <Icon name="plus" />
        </span>
      </summary>
      <div className="accordion__content rte" dangerouslySetInnerHTML={{ __html: body }} />
    </details>
  );
}

async function Complementary({ block, product }) {
  const products = (await getProductRecommendations(product.handle, 'COMPLEMENTARY')).slice(0, block.settings.limit);
  if (!products.length) return null;
  return (
    <product-recommendations class="main-product__complementary" data-loaded="">
      <p className="eyebrow">{block.settings.heading}</p>
      <ul className="product-rows" role="list" data-recommendations="">
        {products.map((item) => (
          <ProductRow key={item.id} product={item} />
        ))}
      </ul>
    </product-recommendations>
  );
}

function Block({ block, product, variant, formId, sectionId, buyBlock, discount, taxesIncluded }) {
  const s = block.settings;
  switch (block.type) {
    case 'vendor':
      return product.vendor ? (
        <p className="main-product__vendor">
          <Link href={vendorUrl(product.vendor)}>{product.vendor}</Link>
        </p>
      ) : null;
    case 'rating':
      return product.rating?.value ? (
        <a href={`#${s.anchor || 'judgeme_product_reviews'}`} className="main-product__rating">
          <Rating product={product} full />
        </a>
      ) : null;
    case 'price': {
      const offerEnds = product.offerEnds?.value;
      const offerActive = product.availableForSale && offerEnds && new Date(offerEnds).getTime() > Date.now();
      return (
        <>
          <div className="main-product__price">
            <Price price={variant.price} compareAt={variant.compareAtPrice} live className="main-product__price-tag" />
            <span className="pill" data-discount-badge="" hidden={!discount}>
              {discount ? `−${discount}%` : ''}
            </span>
            {taxesIncluded && <p className="main-product__tax">{t('products.tax_included')}</p>}
          </div>
          {offerActive && (
            <p className="offer-timer main-product__offer" data-countdown-section="">
              <Icon name="clock" />
              <Countdown end={offerEnds} labelText={t('products.offer.expires_in')} />
            </p>
          )}
        </>
      );
    }
    case 'quantity_breaks':
      return product.bundleOffer?.value === 'true' && buyBlock ? (
        <QuantityBreaks
          block={block}
          variant={variant}
          formId={formId}
          sectionId={sectionId}
          hasStepper={buyBlock.settings.show_quantity}
        />
      ) : null;
    case 'variant_picker':
      return !hasOnlyDefaultVariant(product) ? (
        <div className="main-product__picker">
          <VariantPickerInputs product={product} selected={variant} id={sectionId} />
        </div>
      ) : null;
    case 'buy_buttons':
      return <BuyButtons block={block} product={product} variant={variant} formId={formId} sectionId={sectionId} />;
    case 'delivery':
      return (
        <delivery-estimate
          class="main-product__delivery"
          data-min={s.min_days}
          data-max={s.max_days}
          data-cutoff={s.cutoff}
          data-template={t('products.delivery', { dates: '%dates' })}
          data-template-today={t('products.delivery_cutoff', { time: '%time', dates: '%dates' })}
          data-time-long={t('delivery.time_long')}
          data-time-short={t('delivery.time_short')}
          data-locale="en"
        >
          <Icon name="truck" />
          <span data-delivery-text="">{s.fallback}</span>
        </delivery-estimate>
      );
    case 'info_links':
      return <InfoLinks block={block} product={product} variant={variant} />;
    case 'pickup':
      // Local pickup (theme/snippets/pickup-availability.liquid) is not built here yet: the element alone
      // keeps the layout; the store has no pickup locations
      return <pickup-availability class="main-product__pickup" />;
    case 'meta': {
      // The first six collections by title, as product.collections in Liquid; type and vendor as links
      // (the theme's link_to_type / link_to_vendor: Shopify's automatic collections)
      const listed = [...product.collections.nodes].sort((a, b) => a.title.localeCompare(b.title)).slice(0, 6);
      return (
        <dl className="product-meta">
          {listed.length > 0 && (
            <div className="product-meta__row">
              <dt>{t('products.meta.collections')}</dt>
              <dd>
                {listed.map((item, index) => (
                  <span key={item.handle}>
                    <Link href={`/collections/${item.handle}`}>{item.title}</Link>
                    {index < listed.length - 1 && ', '}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {product.productType && (
            <div className="product-meta__row">
              <dt>{t('products.meta.type')}</dt>
              <dd>
                <Link href={typeUrl(product.productType)}>{product.productType}</Link>
              </dd>
            </div>
          )}
          {product.vendor && (
            <div className="product-meta__row">
              <dt>{t('products.meta.vendor')}</dt>
              <dd>
                <Link href={vendorUrl(product.vendor)}>{product.vendor}</Link>
              </dd>
            </div>
          )}
        </dl>
      );
    }
    case 'highlights':
      return (
        <ul className="main-product__highlights" role="list">
          {[1, 2, 3]
            .filter((i) => s[`text_${i}`])
            .map((i) => (
              <li key={i} className="main-product__highlight">
                <span className="icon-circle main-product__highlight-icon">
                  <Icon name={s[`icon_${i}`]} />
                </span>
                <span dangerouslySetInnerHTML={{ __html: s[`text_${i}`] }} />
              </li>
            ))}
        </ul>
      );
    case 'text':
      return <div className="rte main-product__text" dangerouslySetInnerHTML={{ __html: s.text }} />;
    case 'collapsible':
      return <Collapsible block={block} product={product} />;
    case 'complementary':
      return <Complementary block={block} product={product} />;
    case 'share':
      return (
        <share-button
          class="main-product__share"
          data-url={`${SITE_URL}/products/${product.handle}`}
          data-title={product.title}
          data-copied={t('products.link_copied')}
        >
          <button type="button" className="btn btn--link">
            <Icon name="share" />
            <span data-share-label="">{t('blog.share')}</span>
          </button>
        </share-button>
      );
    default:
      return null;
  }
}

export default function MainProduct({ section, context = {} }) {
  const { settings, blocks } = section;
  const product = context.product;
  if (!product) return null;
  const variant = product.selectedOrFirstAvailableVariant ?? product.variants.nodes[0];
  const layout = settings.gallery_layout;
  const formId = `ProductForm-${section.id}`;
  const buyBlock = blocks.find((block) => block.type === 'buy_buttons');
  const titleBlock = blocks.find((block) => block.type === 'title');
  const discount = discountOf(variant.price, variant.compareAtPrice);
  const images = product.media.nodes.filter((item) => item.mediaContentType === 'IMAGE');
  const single = hasOnlyDefaultVariant(product);
  const currency = variant.price.currencyCode;

  return (
    <product-info
      class={`main-product main-product--${layout} main-product--info-${settings.info_style} color-${settings.color_scheme}`}
      data-update-url=""
      data-product-handle={product.handle}
      data-money-format={moneyFormat(currency)}
      data-label-add={t('products.add_to_cart')}
      data-label-sold-out={t('products.sold_out')}
      data-label-unavailable={t('products.unavailable')}
    >
      {/* Home / product (snippets/breadcrumbs: the collection only when the product is opened from one,
          which a /products/<handle> URL here never is), with its BreadcrumbList data */}
      {settings.breadcrumbs && (
        <div className="page-width main-product__crumbs">
          <Breadcrumbs current={product.title} />
        </div>
      )}
      <div className="page-width main-product__inner">
        {titleBlock && (
          <div className="main-product__head">
            {product.label?.value && <span className="pill pill--soft main-product__label">{product.label.value}</span>}
            <h1 className="h2 main-product__title">{product.title}</h1>
          </div>
        )}
        <Gallery product={product} layout={layout} ratio={settings.ratio} discount={discount} />
        <div className="main-product__info sticky-column">
          <div className={`main-product__info-inner${settings.info_style === 'card' ? ' card' : ''}`}>
            {blocks.map((block) => (
              <Block
                key={block.id}
                block={block}
                product={product}
                variant={variant}
                formId={formId}
                sectionId={section.id}
                buyBlock={buyBlock}
                discount={discount}
                taxesIncluded={context.taxesIncluded}
              />
            ))}
          </div>
        </div>
      </div>

      {images.length > 0 && (
        <dialog className="popup product-lightbox" id={`Lightbox-${section.id}`} aria-label={product.title}>
          <div className="product-lightbox__inner">
            <CloseButton className="product-lightbox__close" />
            <ul className="scroll-track product-lightbox__track" role="list" data-lightbox-track="">
              {product.media.nodes.map((item, index) =>
                item.mediaContentType === 'IMAGE' ? (
                  <li key={index} className="product-lightbox__item" data-index={index}>
                    <Image
                      src={item.image.url}
                      alt={item.alt || product.title}
                      width={item.image.width}
                      height={item.image.height}
                      sizes="100vw"
                    />
                  </li>
                ) : null
              )}
            </ul>
          </div>
        </dialog>
      )}

      {settings.sticky_bar && buyBlock && (
        <sticky-buy-bar class="sticky-buy" data-form={formId} hidden="">
          <div className="page-width sticky-buy__inner">
            <button
              type="button"
              className="btn btn--icon sticky-buy__top"
              data-sticky-top=""
              aria-label={t('products.back_to_options')}
              title={t('products.back_to_options')}
            >
              <Icon name="arrow-right" />
            </button>
            {product.featuredImage && (
              <Image className="sticky-buy__image" src={product.featuredImage.url} alt="" width={48} height={48} sizes="48px" />
            )}
            <div className="sticky-buy__text">
              <span className="sticky-buy__title">{product.title}</span>
              <span className="sticky-buy__meta">
                {!single && <span data-sticky-variant="">{variant.title}</span>}
                <span className="sticky-buy__count" data-sticky-count="" hidden="" />
              </span>
            </div>
            {buyBlock.settings.show_quantity && <QuantityInput className="sticky-buy__qty" title={product.title} sticky />}
            <Price price={variant.price} compareAt={variant.compareAtPrice} live className="sticky-buy__price" />
            <button type="submit" form={formId} className="btn sticky-buy__button" data-add-button="" disabled={!variant.availableForSale}>
              <span data-add-label="">{variant.availableForSale ? t('products.add_to_cart') : t('products.sold_out')}</span>
            </button>
          </div>
        </sticky-buy-bar>
      )}
    </product-info>
  );
}
