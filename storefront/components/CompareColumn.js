// One product column of the compare table: theme/sections/compare-column.liquid — product, price, brand,
// type, availability, options (swatches for colors), description, add button. Its cells line up with the
// label column of the compare page (CSS subgrid). Data: getCompareProduct (lib/queries.js).
import Image from 'next/image';
import Icon from './Icon.js';
import Price from './Price.js';
import { getSettings, t } from '@/lib/theme.js';

const COLOR_NAMES = ['color', 'colour', 'колір', 'цвет'];

export default function CompareColumn({ product }) {
  const url = `/products/${product.handle}`;
  const variant = product.selectedOrFirstAvailableVariant;
  const single = product.allVariants.nodes.length === 1 && product.allOptions[0]?.optionValues[0]?.name === 'Default Title';
  const differentPrices = product.priceRange.minVariantPrice.amount !== product.priceRange.maxVariantPrice.amount;
  const available = (option, value) =>
    product.allVariants.nodes.some(
      (item) => item.availableForSale && item.selectedOptions.some((o) => o.name === option && o.value === value)
    );
  const words = product.description.split(/\s+/).filter(Boolean);
  const description = words.length > 30 ? `${words.slice(0, 30).join(' ')}...` : words.join(' ');
  const image = product.featuredImage;

  return (
    <div className="compare-table__column" data-saved-item>
      <div className="compare-table__cell compare-table__product">
        <a href={url} className="frame compare-table__media" style={{ '--frame-ratio': 1 }} tabIndex={-1} aria-hidden="true">
          {image && <Image src={image.url} alt="" width={image.width} height={image.height} sizes="(min-width: 750px) 22rem, 45vw" />}
        </a>
        <a href={url} className="compare-table__title">
          {product.title}
        </a>
        <button
          type="button"
          className="btn btn--icon compare-table__remove"
          data-saved-remove={product.handle}
          aria-label={t('compare.remove', { product: product.title })}
        >
          <Icon name="close" />
        </button>
      </div>
      <div className="compare-table__cell">
        <Price
          price={differentPrices ? product.priceRange.minVariantPrice : variant.price}
          compareAt={variant?.compareAtPrice}
          from={differentPrices}
        />
      </div>
      <div className="compare-table__cell">{product.vendor || '—'}</div>
      <div className="compare-table__cell">{product.productType || '—'}</div>
      <div className="compare-table__cell">
        {product.availableForSale ? (
          <span className="compare-table__stock">{t('compare.in_stock')}</span>
        ) : (
          <span className="compare-table__stock compare-table__stock--out">{t('products.sold_out')}</span>
        )}
      </div>
      <div className="compare-table__cell">
        {single ? (
          '—'
        ) : (
          <dl className="compare-table__options">
            {product.allOptions.map((option) => {
              const color = COLOR_NAMES.includes(option.name.toLowerCase());
              return (
                <div key={option.name}>
                  <dt>{option.name}</dt>
                  <dd>
                    {option.optionValues.map((value) => (
                      <span
                        key={value.name}
                        className={`compare-table__value${available(option.name, value.name) ? '' : ' compare-table__value--unavailable'}`}
                      >
                        {(color || value.swatch) && (
                          <span
                            className="swatch"
                            style={{ '--swatch': value.swatch?.color || value.name.toLowerCase().replace(/[^a-z]/g, '') }}
                            title={value.name}
                          >
                            <span className="visually-hidden">{value.name}</span>
                          </span>
                        )}
                        {value.name}
                      </span>
                    ))}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}
      </div>
      <div className="compare-table__cell compare-table__description">{description || '—'}</div>
      <div className="compare-table__cell">
        {!product.availableForSale ? (
          <span className="btn btn--outline btn--sm btn--full" aria-disabled="true">
            {t('products.sold_out')}
          </span>
        ) : single ? (
          <cart-item-state data-variant-id={variant.id} data-open-drawer={getSettings().cart_type === 'drawer' ? '' : undefined}>
            <form>
              <input type="hidden" name="merchandiseId" value={variant.id} />
              <button type="submit" className="btn btn--sm btn--full">
                <Icon name="plus" />
                {t('products.add_to_cart')}
              </button>
            </form>
          </cart-item-state>
        ) : (
          <a href={url} className="btn btn--sm btn--full" data-quick-view aria-haspopup="dialog">
            {t('products.choose_options')}
          </a>
        )}
      </div>
    </div>
  );
}
