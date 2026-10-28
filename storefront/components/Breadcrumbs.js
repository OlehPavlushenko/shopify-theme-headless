// Breadcrumbs: the same markup as theme/snippets/breadcrumbs.liquid, with its BreadcrumbList data.
// trail: [{ title, url }] between Home and the current page.
import Link from 'next/link';
import JsonLd from './JsonLd.js';

export default function Breadcrumbs({ trail = [], current, className = '' }) {
  const siteUrl = process.env.SITE_URL || '';
  const items = [{ title: 'Home', url: '/' }, ...trail];
  return (
    <nav className={`breadcrumbs ${className}`.trim()} aria-label="Breadcrumbs">
      <ol className="breadcrumbs__list" role="list">
        {items.map((item) => (
          <li key={item.url} className="breadcrumbs__item">
            <Link href={item.url}>{item.title}</Link>
          </li>
        ))}
        <li className="breadcrumbs__item" aria-current="page">
          {current}
        </li>
      </ol>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [...items, { title: current }].map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.title,
            ...(item.url && { item: siteUrl + item.url }),
          })),
        }}
      />
    </nav>
  );
}
