// theme/sections/header.liquid: the same markup, settings and web components — layout (logo left /
// center), sticky mode, the logo (Theme settings > Logo), the menu picked in the section with dropdowns
// and mega menus (snippets/site-nav, @ui/nav-menu; "Menu promo" / "Menu products" blocks by top-level
// title), the mobile menu panel (snippets/mobile-menu, <drill-menu>), search and cart links.
import Link from 'next/link';
import CartCount from '../CartCount.js';
import Icon from '../Icon.js';
import MegaSlider from '../MegaSlider.js';
import PromoCard from '../PromoCard.js';
import ThemeImage from '../ThemeImage.js';
import { getMenu } from '@/lib/queries.js';
import { localPath } from '@/lib/shopify.js';
import { getSettings, t } from '@/lib/theme.js';

const handleize = (text = '') =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// Desktop navigation: snippets/site-nav.liquid
function SiteNav({ menu, blocks }) {
  return (
    <nav-menu class="site-nav">
      <nav aria-label={t('accessibility.menu')}>
        <ul className="site-nav__list" role="list">
          {menu.map((link, index) => {
            const extras = blocks.filter((block) => handleize(block.settings.menu_item) === handleize(link.title));
            const hasMenu = link.items.length > 0 || extras.length > 0;
            const isMega = extras.length > 0 || link.items.some((child) => child.items.length > 0);
            const panelId = `SiteNavPanel-${index + 1}`;
            return (
              <li
                key={link.id}
                className={`site-nav__item${hasMenu ? ' site-nav__item--has-menu' : ''}${isMega ? ' site-nav__item--mega' : ''}`}
                data-menu-item={hasMenu ? '' : undefined}
              >
                <Link href={localPath(link.url)} className="site-nav__link">
                  {link.title}
                </Link>
                {hasMenu && (
                  <>
                    <button
                      type="button"
                      className="site-nav__toggle"
                      aria-expanded="false"
                      aria-controls={panelId}
                      aria-label={t('accessibility.submenu', { title: link.title })}
                    >
                      <Icon name="chevron-down" />
                    </button>
                    {isMega ? (
                      <div id={panelId} className="site-nav__panel mega-menu">
                        <div className="mega-menu__inner page-width">
                          <ul className="mega-menu__columns" role="list">
                            {link.items.map((child) => (
                              <li key={child.id} className="mega-menu__column">
                                <Link href={localPath(child.url)} className="eyebrow mega-menu__heading">
                                  {child.title}
                                </Link>
                                {child.items.length > 0 && (
                                  <ul className="link-list" role="list">
                                    {child.items.map((grandchild) => (
                                      <li key={grandchild.id}>
                                        <Link href={localPath(grandchild.url)} className="link-list__link">
                                          {grandchild.title}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </li>
                            ))}
                          </ul>
                          {extras.length > 0 && (
                            <div className="mega-menu__extras">
                              {extras.map((block) =>
                                block.type === 'menu_promo' ? (
                                  <PromoCard
                                    key={block.id}
                                    url={block.settings.button_link}
                                    image={block.settings.image}
                                    eyebrow={block.settings.eyebrow}
                                    heading={block.settings.heading}
                                    text={block.settings.text}
                                    linkLabel={block.settings.button_label}
                                    layout={block.settings.layout}
                                    ratio="4 / 5"
                                    sizes="(min-width: 990px) 280px, 100vw"
                                  />
                                ) : (
                                  <MegaSlider key={block.id} heading={block.settings.heading} handles={block.settings.products} />
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <ul id={panelId} className="site-nav__panel link-list site-nav__dropdown" role="list">
                        {link.items.map((child) => (
                          <li key={child.id}>
                            <Link href={localPath(child.url)} className="link-list__link">
                              {child.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </nav-menu>
  );
}

// The mobile menu: one panel per level (snippets/mobile-menu.liquid)
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
            <button type="button" className="mobile-nav__back" data-panel-back aria-label={`${t('accessibility.back')}: ${item.title}`}>
              <Icon name="chevron-left" />
              {item.title}
            </button>
            <Link href={localPath(item.url)} className="mobile-nav__all">
              {t('general.all_title', { title: item.title })}
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

export default async function Header({ section, shopName }) {
  const { settings, blocks } = section;
  const theme = getSettings();
  const menu = await getMenu(settings.menu);
  const hasMenu = menu.length > 0;
  const menuBlocks = blocks.filter((block) => block.type === 'menu_promo' || block.type === 'menu_products');

  return (
    <>
      <site-header
        class={`site-header site-header--${settings.layout} color-${settings.color_scheme}`}
        data-sticky={settings.sticky}
        data-menu={hasMenu ? 'MenuPanel' : undefined}
      >
        <div className="site-header__inner page-width">
          {hasMenu && (
            <button
              type="button"
              className="btn btn--icon site-header__toggle"
              popoverTarget="MenuPanel"
              aria-label={t('accessibility.menu')}
            >
              <Icon name="menu" />
              <Icon name="close" />
            </button>
          )}

          <Link href="/" className="site-header__logo">
            {theme.logo ? (
              <ThemeImage
                image={theme.logo}
                className="site-header__logo-image"
                widths={[theme.logo_width, theme.logo_width * 2]}
                sizes={`${theme.logo_width}px`}
                width={theme.logo_width}
                alt={shopName}
                loading="eager"
              />
            ) : (
              <span className="site-header__shop-name">{shopName}</span>
            )}
          </Link>

          {hasMenu && (
            <div className="site-header__nav">
              <SiteNav menu={menu} blocks={menuBlocks} />
            </div>
          )}

          <div className="site-header__icons">
            {/* Plain links: @ui/dialog opens the panels from them (the href stays as the no-JS fallback) */}
            <a
              href="/search"
              className="btn btn--icon"
              data-dialog-open="SearchPanel"
              aria-haspopup="dialog"
              aria-label={t('search.title')}
            >
              <Icon name="search" />
            </a>
            <a
              href="/cart"
              className="btn btn--icon site-header__cart"
              data-dialog-open={theme.cart_type === 'drawer' ? 'CartDrawer' : undefined}
              aria-haspopup={theme.cart_type === 'drawer' ? 'dialog' : undefined}
              aria-label={t('cart.title')}
            >
              <Icon name="bag" />
              <CartCount />
            </a>
          </div>
        </div>
      </site-header>

      {hasMenu && (
        <div id="MenuPanel" className={`menu-panel color-${settings.color_scheme}`} popover="manual" aria-label={t('accessibility.menu')}>
          <div className="menu-panel__inner page-width">
            <MobileMenu menu={menu} />
          </div>
        </div>
      )}
    </>
  );
}
