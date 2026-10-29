// The site frame, as theme/layout/theme.liquid: shared CSS from packages/ui (the theme's ui-core.css list,
// in cascade order; the layer order comes from tokens.css), Theme settings as CSS (tokens and color
// schemes), the header group's sections, the page, the footer group's sections.
import '@ui-css/tokens.css';
import '@ui-css/base.css';
import '@ui-css/components.css';
import '@ui-css/product-card.css';
import '@ui-css/slider.css';
import '@ui-css/announcements.css';
import '@ui-css/header.css';
import '@ui-css/blocks.css';
import '@ui-css/sections.css';
import '@ui-css/promo.css';
import '@ui-css/footer.css';
import '@ui-css/cart.css';
import '@ui-css/search.css';
import '@ui-css/saved.css';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import { preconnect } from 'react-dom';
import CartDrawer from '@/components/CartDrawer.js';
import CartRecommendations from '@/components/CartRecommendations.js';
import CartUpsell from '@/components/CartUpsell.js';
import CloseButton from '@/components/CloseButton.js';
import SearchPanel from '@/components/SearchPanel.js';
import Sections from '@/components/Sections.js';
import UiScripts from '@/components/UiScripts.js';
import { sizedUrl } from '@/components/ThemeImage.js';
import JsonLd from '@/components/JsonLd.js';
import { SITE_URL } from '@/lib/env.js';
import { getShell } from '@/lib/queries.js';
import { organization, pageMetadata } from '@/lib/seo.js';
import { accountUrl } from '@/lib/shopify.js';
import { CART_STRINGS } from '@/lib/strings.js';
import { freeShippingThreshold, getSections, getSettings, imageUrl, orderDetails, strings, t, themeCss } from '@/lib/theme.js';

// The theme's default fonts (Theme settings > Typography: Bricolage Grotesque, DM Sans)
const body = DM_Sans({ subsets: ['latin'], display: 'swap' });
// The heading font in its one weight, as Shopify serves the setting (bricolage_grotesque_n7): text in the
// heading family is bold everywhere, also where the CSS sets no weight (the product story's ingredient names)
const heading = Bricolage_Grotesque({ subsets: ['latin'], weight: '700', display: 'swap' });

// The defaults of every page (lib/seo.js), the title template and the favicon (Theme settings > Brand >
// Favicon, 32×32 as in theme.liquid)
export async function generateMetadata() {
  const [{ shop }, defaults, favicon] = await Promise.all([getShell(), pageMetadata({}), imageUrl(getSettings().favicon)]);
  return {
    ...defaults,
    ...(SITE_URL && { metadataBase: new URL(SITE_URL) }),
    title: { default: shop.name, template: `%s | ${shop.name}` },
    ...(favicon && { icons: { icon: { url: `${sizedUrl(favicon, 32)}&height=32`, type: 'image/png' } } }),
  };
}

export default async function RootLayout({ children }) {
  // Product and theme images come from Shopify's CDN: the connection opens while the HTML still loads
  preconnect('https://cdn.shopify.com');
  const { shop } = await getShell();
  const settings = getSettings();
  const headerGroup = getSections('sections/header-group.json');
  const header = headerGroup.find((section) => section.type === 'header');
  // The cart drawer section's own settings (theme/sections/cart-drawer.liquid, saved in settings_data)
  const drawer = settings.sections?.['cart-drawer']?.settings ?? {};
  // The token defaults name the font families; next/font serves them under its own names
  const fonts = { '--font-body-family': body.style.fontFamily, '--font-heading-family': heading.style.fontFamily };
  return (
    <html lang="en" style={fonts}>
      <head>
        {/* Unlayered, so Theme settings win over the token defaults (snippets/theme-tokens, color-schemes) */}
        <style dangerouslySetInnerHTML={{ __html: themeCss() }} />
      </head>
      <body>
        <Sections sections={headerGroup} group="header-group" shopName={shop.name} />
        {header && <SearchPanel header={header} />}
        <main id="MainContent" role="main" tabIndex={-1}>
          {children}
        </main>
        <Sections sections={getSections('sections/footer-group.json')} group="footer-group" />
        <JsonLd data={await organization()} />
        {/* Popups and other overlays (theme editor: "Overlays") */}
        <Sections sections={getSections('sections/overlay-group.json')} group="overlay-group" />
        <CartDrawer
          strings={strings(CART_STRINGS)}
          colorScheme={drawer.color_scheme || 'scheme-1'}
          freeShippingThreshold={freeShippingThreshold()}
          upsell={<CartUpsell />}
          recommendations={<CartRecommendations />}
          details={orderDetails('drawer')}
          loginUrl={accountUrl()}
        />
        {/* Quick view popup shell (theme/snippets/quick-view-dialog): @ui/quick-view fills it from /quick-view */}
        <dialog id="QuickView" className="popup quick-view-dialog" aria-label={t('products.quick_view')} data-endpoint="/quick-view">
          <div className="quick-view-dialog__inner">
            <CloseButton className="quick-view-dialog__close" />
            <div className="quick-view-dialog__content" data-quick-view-content aria-live="polite" />
          </div>
        </dialog>
        {/* Texts of the wishlist / compare toasts (@ui/saved-list), as in theme/layout/theme.liquid */}
        {settings.compare_enabled && (
          <template
            data-saved-toast="compare"
            data-added={t('compare.added')}
            data-removed={t('compare.removed')}
            data-full={t('compare.full', { max: '%n' })}
            data-view={t('compare.title')}
            data-undo={t('wishlist.undo')}
            data-href="/pages/compare"
          />
        )}
        {settings.wishlist_enabled && (
          <template
            data-saved-toast="wishlist"
            data-added={t('wishlist.added')}
            data-removed={t('wishlist.removed')}
            data-view={t('wishlist.view')}
            data-undo={t('wishlist.undo')}
            data-href="/pages/wishlist"
          />
        )}
        <UiScripts />
      </body>
    </html>
  );
}
