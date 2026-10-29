// Collections page: the theme's templates/list-collections.json (page header, main-list-collections, …)
import Sections from '@/components/Sections.js';
import { pageMetadata } from '@/lib/seo.js';
import { getTemplate, t } from '@/lib/theme.js';

export const generateMetadata = () => pageMetadata({ title: t('general.collections'), path: '/collections' });

export default function CollectionsPage() {
  return <Sections sections={getTemplate('list-collections').sections} context={{ template: 'list-collections' }} />;
}
