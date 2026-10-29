// Renders the sections of a theme JSON template or section group (lib/theme.js getSections) with their
// React counterparts, each in the wrapper Shopify adds (.shopify-section + the schema's class + the
// group class), so the theme's CSS that relies on it applies. Types without a counterpart yet are skipped.
// Other props reach every section (context: what the template is about — page, collection, …).
import AnnouncementBar from './sections/AnnouncementBar.js';
import BlogPosts from './sections/BlogPosts.js';
import Brands from './sections/Brands.js';
import CollectionList from './sections/CollectionList.js';
import CountdownBar from './sections/CountdownBar.js';
import Faq from './sections/Faq.js';
import Footer from './sections/Footer.js';
import Header from './sections/Header.js';
import Hero from './sections/Hero.js';
import ImageText from './sections/ImageText.js';
import MainCollection from './sections/MainCollection.js';
import MainPage from './sections/MainPage.js';
import MainProduct from './sections/MainProduct.js';
import { ProductRecommendations, ProductStory, RecentlyViewed } from './sections/ProductExtras.js';
import Marquee from './sections/Marquee.js';
import Newsletter from './sections/Newsletter.js';
import PageHeader from './sections/PageHeader.js';
import ProductList from './sections/ProductList.js';
import PromoPopup from './sections/PromoPopup.js';
import PromoGrid from './sections/PromoGrid.js';
import RichText from './sections/RichText.js';
import { MainCompare, MainWishlist } from './sections/SavedLists.js';
import TrustBar from './sections/TrustBar.js';

export const SECTIONS = {
  'announcement-bar': AnnouncementBar,
  'blog-posts': BlogPosts,
  brands: Brands,
  'collection-list': CollectionList,
  'countdown-bar': CountdownBar,
  faq: Faq,
  footer: Footer,
  header: Header,
  hero: Hero,
  'image-text': ImageText,
  'main-collection': MainCollection,
  'main-compare': MainCompare,
  'main-page': MainPage,
  'main-product': MainProduct,
  'product-recommendations': ProductRecommendations,
  'product-story': ProductStory,
  'recently-viewed': RecentlyViewed,
  'main-wishlist': MainWishlist,
  marquee: Marquee,
  newsletter: Newsletter,
  'page-header': PageHeader,
  'product-list': ProductList,
  'promo-grid': PromoGrid,
  'promo-popup': PromoPopup,
  'rich-text': RichText,
  'trust-bar': TrustBar,
};

export default function Sections({ sections, group, ...props }) {
  return sections.map((section, index) => {
    const Section = SECTIONS[section.type];
    if (!Section) return null;
    const className = ['shopify-section', group && `shopify-section-group-${group}`, section.className].filter(Boolean).join(' ');
    return (
      <div key={section.id} id={`shopify-section-${section.id}`} className={className}>
        <Section section={section} index={index} {...props} />
      </div>
    );
  });
}
