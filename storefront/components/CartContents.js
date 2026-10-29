'use client';
// The cart's lines, promo codes and totals, as theme/snippets/cart-line-item, cart-discount and
// cart-summary — shared by the cart drawer and the cart page. Changes go through the server actions
// (app/actions.js), which return the new cart: onChange(cart) renders it and cart:changed tells the
// header's count. Strings: lib/theme.js strings(CART_STRINGS from lib/strings.js).
import { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import Price from './Price.js';
import { setDiscountCodes, updateLine } from '@/app/actions.js';
import { format, formatMoney } from '@/lib/format.js';

const money = (amount, currencyCode) => ({ amount, currencyCode });

export function announce(cart) {
  dispatchEvent(new CustomEvent('cart:changed', { detail: { cart } }));
}

function Line({ line, strings, run }) {
  const { merchandise: variant } = line;
  const title = variant.product.title;
  const url = `/products/${variant.product.handle}`;
  const options = variant.selectedOptions.filter((option) => option.value !== 'Default Title');
  const compareAt = line.cost.compareAtAmountPerQuantity;
  const sale = compareAt && Number(compareAt.amount) > Number(line.cost.amountPerQuantity.amount);
  const discount = sale ? Math.round((1 - Number(line.cost.amountPerQuantity.amount) / Number(compareAt.amount)) * 100) : 0;
  const setQuantity = (quantity) => run(() => updateLine(line.id, quantity));
  return (
    <li className="cart-line">
      <div className="cart-line__media-col">
        <Link href={url} className="cart-line__media frame" tabIndex={-1} aria-hidden="true" style={{ '--frame-ratio': 1 }}>
          {variant.image && (
            <Image src={variant.image.url} alt="" width={variant.image.width} height={variant.image.height} sizes="10rem" />
          )}
        </Link>
        {discount > 0 && <span className="pill cart-line__badge">−{discount}%</span>}
      </div>
      <div className="cart-line__info">
        <div className="cart-line__head">
          <Link href={url} className="cart-line__title line-clamp">
            {title}
          </Link>
          <button
            type="button"
            className="cart-line__remove"
            onClick={() => setQuantity(0)}
            aria-label={format(strings['cart.remove_item'], { product: title })}
          >
            <Icon name="trash" />
          </button>
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
            <button
              type="button"
              className="qty__btn"
              onClick={() => setQuantity(line.quantity - 1)}
              aria-label={format(strings['cart.decrease'], { product: title })}
            >
              <Icon name="minus" />
            </button>
            <input
              key={line.quantity}
              className="qty__input"
              type="number"
              inputMode="numeric"
              min="0"
              defaultValue={line.quantity}
              aria-label={strings['cart.quantity']}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (Number.isInteger(value) && value >= 0 && value !== line.quantity) setQuantity(value);
              }}
            />
            <button
              type="button"
              className="qty__btn"
              onClick={() => setQuantity(line.quantity + 1)}
              aria-label={format(strings['cart.increase'], { product: title })}
            >
              <Icon name="plus" />
            </button>
          </div>
          <div className="cart-line__price">
            <Price
              price={line.cost.totalAmount}
              compareAt={sale ? money(Number(compareAt.amount) * line.quantity, compareAt.currencyCode) : null}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

// Promo codes: theme/snippets/cart-discount.liquid. A code that doesn't apply is removed again and reported.
function Discounts({ cart, strings, run }) {
  const [error, setError] = useState('');
  const applied = cart.discountCodes.filter((code) => code.applicable);
  const apply = (form) => {
    const code = String(form.get('code') ?? '').trim();
    if (!code) return;
    setError('');
    run(async () => {
      const codes = [...applied.map((item) => item.code), code];
      const next = await setDiscountCodes(codes);
      if (next?.discountCodes.some((item) => item.code.toLowerCase() === code.toLowerCase() && !item.applicable)) {
        setError(format(strings['cart.discount.invalid'], { code }));
        return setDiscountCodes(codes.slice(0, -1));
      }
      return next;
    });
  };
  return (
    <div className="cart-discount">
      <details className="cart-discount__details" open={applied.length > 0}>
        <summary className="cart-discount__toggle">{strings['cart.discount.toggle']}</summary>
        <form className="cart-discount__form" action={apply}>
          <input
            className="input"
            type="text"
            name="code"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck="false"
            placeholder={strings['cart.discount.placeholder']}
            aria-label={strings['cart.discount.placeholder']}
          />
          <button type="submit" className="btn btn--outline">
            {strings['cart.discount.apply']}
          </button>
        </form>
      </details>
      <p className="form-error" role="alert">
        {error}
      </p>
      {applied.length > 0 && (
        <ul className="cart-discount__codes" role="list">
          {applied.map(({ code }) => (
            <li key={code}>
              <button
                type="button"
                className="chip cart-discount__code"
                onClick={() => run(() => setDiscountCodes(applied.map((item) => item.code).filter((item) => item !== code)))}
                aria-label={format(strings['cart.discount.remove'], { code })}
              >
                <Icon name="tag" />
                {code}
                <Icon name="close" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Totals: theme/snippets/cart-summary.liquid (savings: discounts plus compare-at prices)
function Summary({ cart, strings, showTotal }) {
  const currency = cart.cost.totalAmount.currencyCode;
  const sale = cart.lines.nodes.reduce((sum, line) => {
    const compareAt = Number(line.cost.compareAtAmountPerQuantity?.amount ?? 0);
    const price = Number(line.cost.amountPerQuantity.amount);
    return sum + (compareAt > price ? (compareAt - price) * line.quantity : 0);
  }, 0);
  const discounts = cart.discountAllocations.reduce((sum, item) => sum + Number(item.discountedAmount.amount), 0);
  const savings = sale + discounts;
  return (
    <div className="cart-summary">
      {cart.discountAllocations.map((item, index) => (
        <div key={index} className="cart-summary__row cart-summary__discount">
          <span>{item.code ?? item.title}</span>
          <span>−{formatMoney(item.discountedAmount)}</span>
        </div>
      ))}
      {showTotal && (
        <div className="cart-summary__row cart-summary__total">
          <span>{strings['cart.total']}</span>
          <span>{formatMoney(cart.cost.totalAmount)}</span>
        </div>
      )}
      {savings > 0 && (
        <p className="cart-summary__savings">
          {strings['cart.savings']} {formatMoney(money(savings, currency))}
        </p>
      )}
      <p className="cart-summary__note">{strings['cart.taxes_note']}</p>
    </div>
  );
}

// layout 'drawer': lines (or the empty state) and the upsell in the scrolling body, footer with promo
// codes, totals and the checkout button holding the total; 'page': lines, then the summary aside.
// upsell: CartUpsell (server-rendered); the products already in the cart are hidden in it.
// loginUrl: "Log in to check out faster" under the empty state.
export default function CartContents({ cart, strings, layout = 'drawer', onChange, upsell, loginUrl }) {
  const [pending, startTransition] = useTransition();
  const run = (action) =>
    startTransition(async () => {
      const next = await action();
      if (next) {
        onChange(next);
        announce(next);
      }
    });
  const lines = cart?.lines.nodes ?? [];

  useEffect(() => {
    const handles = new Set(lines.map((line) => line.merchandise.product.handle));
    for (const item of document.querySelectorAll('.cart-upsell li[data-product-handle]')) {
      item.hidden = handles.has(item.dataset.productHandle);
    }
  });

  if (!lines.length) {
    const empty = (
      <div className="cart-empty stack">
        <p className="h4">{strings['cart.empty']}</p>
        <Link href="/collections/all" className="btn">
          {strings['cart.continue_shopping']}
        </Link>
        {loginUrl && <p className="text-sm" dangerouslySetInnerHTML={{ __html: format(strings['cart.login_html'], { link: loginUrl }) }} />}
      </div>
    );
    return layout === 'drawer' ? (
      <div className="drawer__body cart-drawer__body">
        {empty}
        {upsell}
      </div>
    ) : (
      <>
        {empty}
        {upsell && <div className="main-cart__upsell">{upsell}</div>}
      </>
    );
  }

  const list = (
    <ul className="cart-lines" role="list" aria-busy={pending || undefined}>
      {lines.map((line) => (
        <Line key={line.id} line={line} strings={strings} run={run} />
      ))}
    </ul>
  );
  const checkout = (
    <a href={cart.checkoutUrl} className={`btn${layout === 'page' ? ' btn--full' : ''}`}>
      {layout === 'drawer'
        ? format(strings['cart.checkout_total'], { total: formatMoney(cart.cost.totalAmount) })
        : strings['cart.checkout']}
    </a>
  );

  if (layout === 'page') {
    return (
      <>
        <div className="main-cart__layout">
          <div className="main-cart__lines">{list}</div>
          <aside className="main-cart__summary card stack sticky-column">
            <Discounts cart={cart} strings={strings} run={run} />
            <Summary cart={cart} strings={strings} showTotal />
            {checkout}
          </aside>
        </div>
        {upsell && <div className="main-cart__upsell">{upsell}</div>}
      </>
    );
  }
  return (
    <>
      <div className="drawer__body cart-drawer__body">
        {list}
        {upsell}
      </div>
      <div className="drawer__footer cart-drawer__footer">
        <Discounts cart={cart} strings={strings} run={run} />
        <Summary cart={cart} strings={strings} />
        <div className="cart-drawer__actions">
          {checkout}
          <Link href="/cart" className="cart-drawer__view-cart">
            {strings['cart.view_cart']}
          </Link>
        </div>
      </div>
    </>
  );
}
