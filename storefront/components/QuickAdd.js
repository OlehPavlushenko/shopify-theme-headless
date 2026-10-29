'use client';
// The product card's add button: theme/snippets/product-card.liquid (quick_add) + <cart-item-state>.
// One variant: "+ Add to cart", then "− 2 in cart +" (data-in-cart). With options: "Choose options"
// (to the product page), dark "✓ In cart" once any of its variants is in the cart.
import { useTransition } from 'react';
import Link from 'next/link';
import Icon from './Icon.js';
import { announce } from './CartContents.js';
import { addToCart, updateLine } from '@/app/actions.js';
import { quantityIn, useCart } from '@/lib/cart-client.js';
import { format } from '@/lib/format.js';

export default function QuickAdd({ product, variantId, single, strings, openDrawer }) {
  const cart = useCart();
  const [pending, startTransition] = useTransition();
  const inCart = single ? quantityIn(cart, { variantId }) : quantityIn(cart, { productHandle: product.handle });
  const line = single ? cart?.lines.nodes.find((item) => item.merchandise.id === variantId) : null;

  const run = (action, open = false) =>
    startTransition(async () => {
      const next = await action();
      if (!next) return;
      announce(next);
      const drawer = document.getElementById('CartDrawer');
      if (open && openDrawer && drawer) (await import('@ui/dialog')).openDialog(drawer);
    });

  if (!single) {
    return (
      <div className="product-card__quick-add">
        <div className="product-card__cart" data-in-cart={inCart > 0 ? '' : undefined}>
          <Link href={`/products/${product.handle}`} className="btn btn--outline btn--sm btn--full product-card__options">
            <span className="product-card__options-label">{strings['products.choose_options']}</span>
            <span className="product-card__options-in-cart">
              <Icon name="check" />
              <span>{strings['products.in_cart_short']}</span>
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const add = (formData) => run(() => addToCart(formData), true);
  return (
    <div className="product-card__quick-add">
      <div className="product-card__cart" data-in-cart={inCart > 0 ? '' : undefined} aria-busy={pending || undefined}>
        <ajax-cart-product-form>
          <form action={add}>
            <input type="hidden" name="merchandiseId" value={variantId} />
            <button type="submit" className="btn btn--outline btn--sm btn--full" disabled={pending}>
              <Icon name="plus" />
              {strings['products.add_to_cart']}
            </button>
          </form>
        </ajax-cart-product-form>
        <div className="product-card__in-cart">
          <button
            type="button"
            className="product-card__step"
            onClick={() => line && run(() => updateLine(line.id, line.quantity - 1))}
            aria-label={format(strings['cart.decrease'], { product: product.title })}
          >
            <Icon name="minus" />
          </button>
          <span className="product-card__in-cart-label" aria-live="polite">
            {format(strings['products.in_cart'], { count: inCart })}
          </span>
          <button
            type="button"
            className="product-card__step"
            onClick={() => line && run(() => updateLine(line.id, line.quantity + 1))}
            aria-label={format(strings['cart.increase'], { product: product.title })}
          >
            <Icon name="plus" />
          </button>
        </div>
      </div>
    </div>
  );
}
