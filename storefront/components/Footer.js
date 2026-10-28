// Site footer: the same classes as theme/sections/footer.liquid (styles: packages/ui/css/footer.css).
// First version: the footer menu as columns (a menu item with children is a column, a plain item a link
// in the first one), copyright and policies.
import Link from 'next/link';
import { localPath } from '@/lib/shopify.js';

export default function Footer({ shopName, menu, policies }) {
  const columns = menu.filter((item) => item.items.length > 0);
  const links = menu.filter((item) => item.items.length === 0);
  if (links.length > 0) columns.unshift({ id: 'links', title: shopName, items: links });

  return (
    <footer className="site-footer">
      {columns.length > 0 && (
        <div className="site-footer__columns page-width">
          {columns.map((column) => (
            <details key={column.id} className="site-footer__column" open>
              <summary className="site-footer__heading eyebrow">{column.title}</summary>
              <ul className="link-list" role="list">
                {column.items.map((item) => (
                  <li key={item.id}>
                    <Link href={localPath(item.url)} className="link-list__link">
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      )}
      <div className="site-footer__bottom page-width">
        <p className="site-footer__copyright">
          &copy; {new Date().getFullYear()} <Link href="/">{shopName}</Link>
        </p>
        {policies.length > 0 && (
          <ul className="site-footer__policies" role="list">
            {policies.map((policy) => (
              <li key={policy.url}>
                <Link href={localPath(policy.url)}>{policy.title}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
