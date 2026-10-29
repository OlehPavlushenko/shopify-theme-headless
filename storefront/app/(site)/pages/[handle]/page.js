// A page: the theme's page template — templates/page.<suffix>.json for the template set on the page in the
// admin (Admin API; the handle without the token), else templates/page.json
import { notFound } from 'next/navigation';
import Sections from '@/components/Sections.js';
import { pageTemplateSuffix } from '@/lib/admin.js';
import { getPage } from '@/lib/queries.js';
import { getTemplate } from '@/lib/theme.js';

// The page's template (its suffix and sections)
async function template(handle) {
  return getTemplate('page', (await pageTemplateSuffix(handle)) ?? handle);
}

export async function generateMetadata({ params }) {
  const { handle } = await params;
  const [page, { suffix }] = await Promise.all([getPage(handle), template(handle)]);
  if (!page) return {};
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
  const [page, { suffix, sections }] = await Promise.all([getPage(handle), template(handle)]);
  if (!page) notFound();
  return <Sections sections={sections} context={{ template: 'page', suffix, page }} />;
}
