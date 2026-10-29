// Home page: the theme's templates/index.json — the same sections, settings and order as in the theme
// editor. On the home page the logo carries the shop name as the page's h1 in the theme; here a
// visually hidden h1 does.
import JsonLd from '@/components/JsonLd.js';
import Sections from '@/components/Sections.js';
import { getShell } from '@/lib/queries.js';
import { pageMetadata, website } from '@/lib/seo.js';
import { getSections } from '@/lib/theme.js';

export const generateMetadata = () => pageMetadata({ path: '/' });

export default async function Home() {
  const { shop } = await getShell();
  return (
    <>
      <h1 className="visually-hidden">{shop.name}</h1>
      <Sections sections={getSections('templates/index.json')} />
      <JsonLd data={await website()} />
    </>
  );
}
