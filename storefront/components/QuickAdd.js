// The product card's add button: theme/snippets/product-card.liquid (quick_add), the same markup with
// <cart-item-state> (lib/cart-elements.js). One variant: "+ Add to cart", then "− 2 in cart +". With
// options: "Choose options" (the product page), dark "✓ In cart" once any of its variants is in the cart.
import Icon from './Icon.js';
import { getSettings, t } from '@/lib/theme.js';

export default function QuickAdd({ product, variantId, single }) {
  const openDrawer = getSettings().cart_type === 'drawer' ? '' : undefined;
  if (!single) {
    return (
      <div className="product-card__quick-add">
        <cart-item-state class="product-card__cart" data-product-handle={product.handle} data-label={t('products.in_cart_short')}>
          <a href={`/products/${product.handle}`} className="btn btn--outline btn--sm btn--full product-card__options">
            <span className="product-card__options-label">{t('products.choose_options')}</span>
            <span className="product-card__options-in-cart">
              <Icon name="check" />
              <span data-in-cart-label>{t('products.in_cart_short')}</span>
            </span>
          </a>
        </cart-item-state>
      </div>
    );
  }
  const label = t('products.in_cart', { count: '%n' });
  return (
    <div className="product-card__quick-add">
      <cart-item-state class="product-card__cart" data-variant-id={variantId} data-label={label} data-open-drawer={openDrawer}>
        <ajax-cart-product-form>
          <form>
            <input type="hidden" name="merchandiseId" value={variantId} />
            <button type="submit" className="btn btn--outline btn--sm btn--full">
              <Icon name="plus" />
              {t('products.add_to_cart')}
            </button>
          </form>
        </ajax-cart-product-form>
        <div className="product-card__in-cart">
          <button type="button" className="product-card__step" data-step="-1" aria-label={t('cart.decrease', { product: product.title })}>
            <Icon name="minus" />
          </button>
          <span className="product-card__in-cart-label" data-in-cart-label aria-live="polite">
            {label.replace('%n', 0)}
          </span>
          <button type="button" className="product-card__step" data-step="1" aria-label={t('cart.increase', { product: product.title })}>
            <Icon name="plus" />
          </button>
        </div>
      </cart-item-state>
    </div>
  );
}
