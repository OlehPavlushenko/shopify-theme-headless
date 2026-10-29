// Hidden UI on its own, for <lazy-section> (@ui/lazy-section, data-endpoint): the full element of a
// placeholder (components/LazySection.js), found by its section and block id — part=menu (a mega menu's
// products), search (the search panel's products; both in the header group) or popup (a promo popup's
// products, in the overlay group). The element carries data-lazy-key = the block id.
import { notFound } from 'next/navigation';
import MegaSlider from '@/components/MegaSlider.js';
import { ProductsBlock, productSizes } from '@/components/SearchPanel.js';
import { PopupProducts } from '@/components/sections/PromoPopup.js';
import { getSections } from '@/lib/theme.js';

const GROUPS = { menu: 'header-group', search: 'header-group', popup: 'overlay-group' };

export default async function LazyPart({ searchParams }) {
  const { part, section: sectionId, key } = await searchParams;
  if (!GROUPS[part]) notFound();
  const section = getSections(`sections/${GROUPS[part]}.json`).find((item) => item.id === sectionId);
  const block = section?.blocks.find((item) => item.id === key);
  if (!block) notFound();
  if (part === 'menu') return <MegaSlider block={block} />;
  if (part === 'search') return <ProductsBlock block={block} sizes={productSizes(section.settings.search_style)} />;
  return <PopupProducts block={block} />;
}
