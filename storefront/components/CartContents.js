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
import Swatch, { isColorOption } from './Swatch.js';
import { setCartAttributes, setCartNote, setDiscountCodes, updateLine } from '@/app/actions.js';
import { publish } from '@/lib/cart-client.js';
import { format, formatMoney } from '@/lib/format.js';

const money = (amount, currencyCode) => ({ amount, currencyCode });

// Tells the rest of the page (header count, drawer, quick add) about the new cart
export const announce = publish;

// Free-shipping progress: theme/snippets/cart-free-shipping.liquid (threshold in the store currency)
export function FreeShipping({ cart, threshold, strings }) {
  if (!threshold || !cart?.totalQuantity) return null;
  const total = Number(cart.cost.totalAmount.amount);
  const remaining = threshold - total;
  const progress = Math.min(100, Math.round((total / threshold) * 100));
  const text =
    remaining > 0
      ? format(strings['cart.free_shipping.remaining_html'], {
          amount: formatMoney({ amount: remaining, currencyCode: cart.cost.totalAmount.currencyCode }),
        })
      : strings['cart.free_shipping.unlocked_html'];
  return (
    <div className={`free-shipping${remaining <= 0 ? ' free-shipping--done' : ''}`} style={{ '--progress': `${progress}%` }}>
      <p className="free-shipping__text">
        <Icon name="truck" />
        <span dangerouslySetInnerHTML={{ __html: text }} />
      </p>
      <div
        className="free-shipping__bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress}
        aria-label={strings['cart.free_shipping.label']}
      />
    </div>
  );
}

// Order details: the note and the cart attribute fields (theme/snippets/cart-attribute.liquid; the cart
// drawer's / cart page's blocks: text, select, radio, checkbox). Saved on change.
// details: { showNote, fields: [{ id, type, label, options, required }] }
function OrderFields({ cart, details, strings, run, noteField = 'extras' }) {
  const attributes = cart.attributes ?? [];
  const current = (key) => attributes.find((item) => item.key === key)?.value ?? '';
  const save = (key, value) =>
    run(() => setCartAttributes([...attributes.filter((item) => item.key !== key), ...(value ? [{ key, value }] : [])]));
  const note = details.showNote && (
    <label className={noteField === 'extras' ? 'cart-extras__note-field' : 'field'}>
      <span className={noteField === 'extras' ? 'cart-attribute__label' : 'field__label'}>{strings['cart.note']}</span>
      <textarea
        className={`input${noteField === 'extras' ? ' cart-extras__note' : ''}`}
        name="note"
        rows={noteField === 'extras' ? 2 : undefined}
        defaultValue={cart.note ?? ''}
        onBlur={(event) => event.target.value !== (cart.note ?? '') && run(() => setCartNote(event.target.value))}
      />
    </label>
  );
  const fields = details.fields
    .filter((field) => field.label?.trim())
    .map((field) => {
      const label = field.label.trim();
      const id = `CartAttribute-${field.id}`;
      const options = (field.options ?? '')
        .split('|')
        .map((option) => option.trim())
        .filter(Boolean);
      return (
        <div key={field.id} className={`cart-attribute cart-attribute--${field.type}`}>
          {field.type === 'text' && (
            <>
              <label className="cart-attribute__label" htmlFor={id}>
                {label}
              </label>
              <input
                id={id}
                className="input"
                type="text"
                defaultValue={current(label)}
                required={field.required}
                onBlur={(event) => event.target.value !== current(label) && save(label, event.target.value)}
              />
            </>
          )}
          {field.type === 'select' && (
            <>
              <label className="cart-attribute__label" htmlFor={id}>
                {label}
              </label>
              <select id={id} className="input" defaultValue={current(label)} onChange={(event) => save(label, event.target.value)}>
                <option value="">—</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </>
          )}
          {field.type === 'radio' && (
            <>
              <span className="cart-attribute__label" id={`${id}-label`}>
                {label}
              </span>
              <div className="cart-attribute__options" role="radiogroup" aria-labelledby={`${id}-label`}>
                {options.map((option) => (
                  <label key={option} className="cart-attribute__choice">
                    <input
                      type="radio"
                      name={id}
                      value={option}
                      defaultChecked={current(label) === option}
                      onChange={() => save(label, option)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            </>
          )}
          {field.type === 'checkbox' && (
            <label className="cart-attribute__choice">
              <input
                type="checkbox"
                defaultChecked={current(label) === 'Yes'}
                onChange={(event) => save(label, event.target.checked ? 'Yes' : '')}
              />
              {label}
            </label>
          )}
        </div>
      );
    });
  if (!note && !fields.length) return null;
  if (noteField !== 'extras') {
    return (
      <>
        {note}
        {fields}
      </>
    );
  }
  return (
    <details className="cart-extras">
      <summary className="cart-extras__summary">
        {strings['cart.order_details']}
        <Icon name="chevron-down" />
      </summary>
      <div className="cart-extras__content stack">
        {note}
        {fields}
      </div>
    </details>
  );
}

// A color option's value with its swatch, as on the product card (the product's option of that name)
function swatchOf(product, picked) {
  const option = product.options?.find((item) => item.name === picked.name);
  return option && isColorOption(option) ? option.optionValues.find((value) => value.name === picked.value) : null;
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
                <dd>
                  {swatchOf(variant.product, option) && <Swatch value={swatchOf(variant.product, option)} className="cart-line__swatch" />}
                  {option.value}
                </dd>
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
// loginUrl: "Log in to check out faster" under the empty state. details: the order details fields
// (OrderFields). threshold: the free-shipping progress on the page (the drawer shows it in its header).
export default function CartContents({ cart, strings, layout = 'drawer', onChange, upsell, loginUrl, details, threshold }) {
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
            <FreeShipping cart={cart} threshold={threshold} strings={strings} />
            {details && <OrderFields cart={cart} details={details} strings={strings} run={run} noteField="page" />}
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
        {details && <OrderFields cart={cart} details={details} strings={strings} run={run} />}
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
