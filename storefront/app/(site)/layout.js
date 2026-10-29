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
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import CartDrawer from '@/components/CartDrawer.js';
import SearchPanel from '@/components/SearchPanel.js';
import Sections from '@/components/Sections.js';
import UiScripts from '@/components/UiScripts.js';
import { getShell } from '@/lib/queries.js';
import { CART_STRINGS } from '@/lib/strings.js';
import { getSections, getSettings, strings, themeCss } from '@/lib/theme.js';

// The theme's default fonts (Theme settings > Typography: Bricolage Grotesque, DM Sans)
const body = DM_Sans({ subsets: ['latin'], display: 'swap' });
const heading = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap' });

export async function generateMetadata() {
  const { shop } = await getShell();
  return { title: { default: shop.name, template: `%s | ${shop.name}` }, description: shop.description };
}

export default async function RootLayout({ children }) {
  const { shop } = await getShell();
  const settings = getSettings();
  const headerGroup = getSections('sections/header-group.json');
  const header = headerGroup.find((section) => section.type === 'header');
  // The cart drawer section's own settings (theme/sections/cart-drawer.liquid, saved in settings_data)
  const drawer = settings.sections?.['cart-drawer']?.settings ?? {};
  const threshold = settings.show_free_shipping !== false ? Number(settings.free_shipping_threshold) || 0 : 0;
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
        <CartDrawer strings={strings(CART_STRINGS)} colorScheme={drawer.color_scheme || 'scheme-1'} freeShippingThreshold={threshold} />
        <UiScripts />
      </body>
    </html>
  );
}
