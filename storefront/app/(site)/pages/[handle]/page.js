// A page: the theme's page template — templates/page.<handle>.json when the theme has one (the
// wishlist and compare pages use page.wishlist / page.compare), else templates/page.json
import { notFound } from 'next/navigation';
import Sections from '@/components/Sections.js';
import { getPage } from '@/lib/queries.js';
import { getTemplate } from '@/lib/theme.js';

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const page = await getPage(handle);
  if (!page) return {};
  const { suffix } = getTemplate('page', handle);
  return {
    title: page.seo?.title || page.title,
    description: page.seo?.description || page.bodySummary?.slice(0, 160),
    alternates: { canonical: `/pages/${handle}` },
    // The wishlist and compare pages are personal: as in the theme, kept out of search engines
    ...((suffix === 'wishlist' || suffix === 'compare') && { robots: { index: false, follow: true } }),
  };
}

export default async function Page({ params }) {
  const { handle } = await params;
  const page = await getPage(handle);
  if (!page) notFound();
  const { suffix, sections } = getTemplate('page', handle);
  return <Sections sections={sections} context={{ template: 'page', suffix, page }} />;
}
