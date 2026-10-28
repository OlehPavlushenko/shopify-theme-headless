'use client';
// The product page's buy form: quantity and "Add to cart" (theme: the buy_buttons block of
// sections/main-product.liquid). Runs the addToCart server action; afterwards "✓ Added · View cart".
import { useState, useTransition } from 'react';
import Link from 'next/link';
import Icon from './Icon.js';
import { addToCart } from '@/app/actions.js';

export default function AddToCart({ variantId, available, productTitle }) {
  const [pending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const submit = (formData) =>
    startTransition(async () => {
      await addToCart(formData);
      setAdded(true);
      dispatchEvent(new Event('cart:changed'));
    });

  return (
    <div className="main-product__buy">
      <form action={submit} className="main-product__form">
        <input type="hidden" name="merchandiseId" value={variantId} />
        <div className="main-product__actions">
          <div className="qty main-product__qty">
            <button
              type="button"
              className="qty__btn"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              aria-label={`Decrease quantity for ${productTitle}`}
            >
              <Icon name="minus" />
            </button>
            <input
              className="qty__input"
              type="number"
              name="quantity"
              value={quantity}
              min="1"
              inputMode="numeric"
              aria-label="Quantity"
              onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            />
            <button
              type="button"
              className="qty__btn"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label={`Increase quantity for ${productTitle}`}
            >
              <Icon name="plus" />
            </button>
          </div>
          <button type="submit" className="btn btn--lg main-product__add" disabled={!available || pending} aria-busy={pending || undefined}>
            {available ? 'Add to cart' : 'Sold out'}
          </button>
        </div>
      </form>
      {added && (
        <p className="main-product__in-cart" data-in-cart role="status">
          <Icon name="check" />
          <span>Added to cart</span>
          <Link href="/cart">View cart</Link>
        </p>
      )}
    </div>
  );
}
