// Site header: the same markup and classes as theme/sections/header.liquid (styles: packages/ui/css/header.css).
// First version: logo, top-level menu links, search and cart links (with the count); dropdowns, the
// mobile menu and the search panel come next.
import Link from 'next/link';
import CartCount from './CartCount.js';
import Icon from './Icon.js';
import { localPath } from '@/lib/shopify.js';

export default function Header({ shopName, menu }) {
  return (
    <header className="site-header site-header--logo-left">
      <div className="site-header__inner page-width">
        <Link href="/" className="site-header__logo">
          <span className="site-header__shop-name">{shopName}</span>
        </Link>

        {menu.length > 0 && (
          <div className="site-header__nav">
            <nav className="site-nav" aria-label="Main">
              <ul className="site-nav__list" role="list">
                {menu.map((item) => (
                  <li key={item.id} className="site-nav__item">
                    <Link href={localPath(item.url)} className="site-nav__link">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        <div className="site-header__icons">
          <Link href="/search" className="btn btn--icon" aria-label="Search">
            <Icon name="search" />
          </Link>
          <Link href="/cart" className="btn btn--icon site-header__cart" aria-label="Cart">
            <Icon name="bag" />
            <CartCount />
          </Link>
        </div>
      </div>
    </header>
  );
}
