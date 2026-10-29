// 404: the theme's templates/404.json — main-404 (heading, text, search, links) and the sections after it
import Sections from '@/components/Sections.js';
import { getTemplate, t } from '@/lib/theme.js';

export const metadata = { title: t('404.title') };

export default function NotFound() {
  return <Sections sections={getTemplate('404').sections} context={{ template: '404' }} />;
}
