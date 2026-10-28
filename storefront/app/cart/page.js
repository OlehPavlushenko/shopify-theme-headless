// Cart page: the theme's main-cart layout — lines (image, title, options, quantity, remove, price) and
// the summary with the total and the checkout button (Shopify's checkout, cart.checkoutUrl).
// Styles: packages/ui/css/cart.css. Per visitor: rendered on every request.
import '@ui-css/cart.css';
import Image from 'next/image';
import Link from 'next/link';
import CartForm from '@/components/CartForm.js';
import Icon from '@/components/Icon.js';
import Price from '@/components/Price.js';
import { updateLine } from '@/app/actions.js';
import { getCart } from '@/lib/cart.js';
import { formatMoney } from '@/lib/shopify.js';

export const metadata = { title: 'Cart', robots: { index: false } };

function QuantityButton({ lineId, quantity, icon, label }) {
  return (
    <CartForm action={updateLine} className="cart-line__step">
      <input type="hidden" name="lineId" value={lineId} />
      <input type="hidden" name="quantity" value={quantity} />
      <button type="submit" className="qty__btn" aria-label={label}>
        <Icon name={icon} />
      </button>
    </CartForm>
  );
}

export default async function CartPage() {
  const cart = await getCart();
  const lines = cart?.lines.nodes ?? [];

  return (
    <div className="main-cart section-spacing">
      <div className="page-width">
        <h1 className="main-cart__title h2">Your cart</h1>
        {lines.length === 0 ? (
          <div className="cart-empty stack">
            <p className="h4">Your cart is empty</p>
            <Link href="/collections/all" className="btn">
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="main-cart__layout">
            <div className="main-cart__lines">
              <ul className="cart-lines" role="list">
                {lines.map((line) => {
                  const { merchandise: variant } = line;
                  const url = `/products/${variant.product.handle}`;
                  const options = variant.selectedOptions.filter((option) => option.value !== 'Default Title');
                  const compareAt = line.cost.compareAtAmountPerQuantity;
                  return (
                    <li key={line.id} className="cart-line">
                      <div className="cart-line__media-col">
                        <Link href={url} className="cart-line__media frame" tabIndex={-1} aria-hidden="true" style={{ '--frame-ratio': 1 }}>
                          {variant.image && (
                            <Image src={variant.image.url} alt="" width={variant.image.width} height={variant.image.height} sizes="10rem" />
                          )}
                        </Link>
                      </div>
                      <div className="cart-line__info">
                        <div className="cart-line__head">
                          <Link href={url} className="cart-line__title line-clamp">
                            {variant.product.title}
                          </Link>
                          <CartForm action={updateLine}>
                            <input type="hidden" name="lineId" value={line.id} />
                            <input type="hidden" name="quantity" value="0" />
                            <button type="submit" className="cart-line__remove" aria-label={`Remove ${variant.product.title}`}>
                              <Icon name="trash" />
                            </button>
                          </CartForm>
                        </div>
                        {options.length > 0 && (
                          <dl className="cart-line__options">
                            {options.map((option) => (
                              <div key={option.name} className="cart-line__option">
                                <dt>{option.name}:</dt>
                                <dd>{option.value}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                        <div className="cart-line__actions">
                          <div className="qty">
                            <QuantityButton
                              lineId={line.id}
                              quantity={line.quantity - 1}
                              icon="minus"
                              label={`Decrease quantity for ${variant.product.title}`}
                            />
                            <input className="qty__input" type="number" value={line.quantity} readOnly aria-label="Quantity" />
                            <QuantityButton
                              lineId={line.id}
                              quantity={line.quantity + 1}
                              icon="plus"
                              label={`Increase quantity for ${variant.product.title}`}
                            />
                          </div>
                          <div className="cart-line__price">
                            <Price
                              price={line.cost.totalAmount}
                              compareAt={
                                compareAt && {
                                  amount: Number(compareAt.amount) * line.quantity,
                                  currencyCode: compareAt.currencyCode,
                                }
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="main-cart__summary card stack sticky-column" aria-label="Order summary">
              <div className="cart-summary">
                <div className="cart-summary__row cart-summary__total">
                  <span>Total</span>
                  <span>{formatMoney(cart.cost.totalAmount)}</span>
                </div>
                <p className="cart-summary__note">Taxes and shipping are calculated at checkout.</p>
              </div>
              <a href={cart.checkoutUrl} className="btn btn--full">
                Check out
              </a>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
