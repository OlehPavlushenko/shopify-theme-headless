'use client';
// The header's cart count bubble (.count-badge, as in the theme). Read from the cart_count cookie in
// the browser, so the pages around it stay static: on load, after every navigation and on
// cart:changed (CartForm, after a cart action).
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

const read = () => Number(document.cookie.match(/(?:^|; )cart_count=(\d+)/)?.[1] ?? 0);

export default function CartCount() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => setCount(read()), [pathname]);
  useEffect(() => {
    const update = () => setCount(read());
    addEventListener('cart:changed', update);
    return () => removeEventListener('cart:changed', update);
  }, []);

  return (
    <span
      className="count-badge count-badge--sm cart-count"
      data-cart-count-bubble
      data-empty={count === 0 ? '' : undefined}
      aria-hidden="true"
    >
      {count}
    </span>
  );
}
