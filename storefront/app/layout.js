// The site frame: shared CSS from packages/ui (the theme's ui-core.css list, in cascade order; the layer
// order comes from tokens.css), fonts, header and footer.
import '@ui-css/tokens.css';
import '@ui-css/base.css';
import '@ui-css/components.css';
import '@ui-css/product-card.css';
import '@ui-css/slider.css';
import '@ui-css/announcements.css';
import '@ui-css/header.css';
import '@ui-css/blocks.css';
import '@ui-css/sections.css';
import '@ui-css/footer.css';
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google';
import Header from '@/components/Header.js';
import Footer from '@/components/Footer.js';
import { getShell } from '@/lib/queries.js';

const body = DM_Sans({ subsets: ['latin'], display: 'swap' });
const heading = Bricolage_Grotesque({ subsets: ['latin'], display: 'swap' });

export async function generateMetadata() {
  const { shop } = await getShell();
  return { title: { default: shop.name, template: `%s | ${shop.name}` }, description: shop.description };
}

export default async function RootLayout({ children }) {
  const { shop, header, footer, policies } = await getShell();
  // The token defaults name the font families; next/font serves them under its own names
  const fonts = { '--font-body-family': body.style.fontFamily, '--font-heading-family': heading.style.fontFamily };
  return (
    <html lang="en" style={fonts}>
      <body>
        <Header shopName={shop.name} menu={header} />
        <main id="MainContent">{children}</main>
        <Footer shopName={shop.name} menu={footer} policies={policies} />
      </body>
    </html>
  );
}
