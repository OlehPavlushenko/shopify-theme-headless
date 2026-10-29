// Site header: the same markup and classes as theme/sections/header.liquid (styles: packages/ui/css/header.css)
// and the same web components (UiScripts loads them): <site-header> (sticky on scroll up), the mobile
// menu panel (a popover, @ui/dialog) with <drill-menu> levels. Desktop: top-level links; dropdowns next.
import Link from 'next/link';
import CartCount from './CartCount.js';
import Icon from './Icon.js';
import { localPath } from '@/lib/shopify.js';

// The mobile menu: one panel per level (theme: snippets/mobile-menu.liquid)
function MobileMenu({ menu }) {
  const parents = menu.filter((item) => item.items.length > 0);
  return (
    <drill-menu class="mobile-nav">
      <div className="mobile-nav__panel" data-panel="root">
        <ul className="mobile-nav__list" role="list">
          {menu.map((item) => (
            <li key={item.id}>
              {item.items.length > 0 ? (
                <button type="button" className="mobile-nav__link" data-panel-open={`MenuPanel-${item.id}`}>
                  {item.title}
                  <Icon name="chevron-right" />
                </button>
              ) : (
                <Link href={localPath(item.url)} className="mobile-nav__link">
                  {item.title}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
      {parents.map((item) => (
        <div key={item.id} className="mobile-nav__panel" data-panel={`MenuPanel-${item.id}`} hidden>
          <div className="mobile-nav__head">
            <button type="button" className="mobile-nav__back" data-panel-back aria-label={`Back: ${item.title}`}>
              <Icon name="chevron-left" />
              {item.title}
            </button>
            <Link href={localPath(item.url)} className="mobile-nav__all">
              All {item.title}
            </Link>
          </div>
          <ul className="mobile-nav__list" role="list">
            {item.items.map((child) => (
              <li key={child.id}>
                <Link href={localPath(child.url)} className="mobile-nav__link">
                  {child.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </drill-menu>
  );
}

export default function Header({ shopName, menu }) {
  const hasMenu = menu.length > 0;
  return (
    <div className="site-header-section">
      <site-header class="site-header site-header--logo-left" data-sticky="scroll-up" data-menu={hasMenu ? 'MenuPanel' : undefined}>
        <div className="site-header__inner page-width">
          {hasMenu && (
            <button type="button" className="btn btn--icon site-header__toggle" popoverTarget="MenuPanel" aria-label="Menu">
              <Icon name="menu" />
              <Icon name="close" />
            </button>
          )}

          <Link href="/" className="site-header__logo">
            <span className="site-header__shop-name">{shopName}</span>
          </Link>

          {hasMenu && (
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
      </site-header>

      {hasMenu && (
        <div id="MenuPanel" className="menu-panel" popover="manual" aria-label="Menu">
          <div className="menu-panel__inner page-width">
            <MobileMenu menu={menu} />
          </div>
        </div>
      )}
    </div>
  );
}
