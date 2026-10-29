// theme/sections/footer.liquid: columns are blocks in the editor's order вЂ” brand (logo, text, social),
// menu, contacts, products, articles вЂ” accordions on phones (<site-footer>, @ui/footer); bottom row with
// copyright, policies and "Back to top". (Payment icons need Liquid's payment_type_svg_tag: not here.)
import Image from 'next/image';
import Link from 'next/link';
import Icon from '../Icon.js';
import ProductRow from '../ProductRow.js';
import ThemeImage from '../ThemeImage.js';
import { SocialLinks, StoreContacts } from '../StoreContacts.js';
import { getArticles, getCollection, getMenu, getProductsByHandles, getShell } from '@/lib/queries.js';
import { localPath } from '@/lib/shopify.js';
import { getSettings, t } from '@/lib/theme.js';

const formatDate = (iso) => new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(iso));

function Column({ heading, children }) {
  return (
    <details className="site-footer__column" data-footer-column open>
      <summary className="site-footer__heading eyebrow">
        {heading}
        <Icon name="chevron-down" />
      </summary>
      {children}
    </details>
  );
}

// One column's data (menu links, products, articles); null = nothing to show, the column is left out
async function load(block) {
  const s = block.settings;
  switch (block.type) {
    case 'menu': {
      const links = await getMenu(s.menu);
      return links.length ? links : null;
    }
    case 'products': {
      const products = s.products?.length
        ? await getProductsByHandles(s.products)
        : ((await getCollection(s.collection))?.products.nodes ?? []);
      return products.length ? products.slice(0, s.limit) : null;
    }
    case 'articles': {
      const blog = await getArticles(s.blog, s.limit);
      return blog.articles.length ? blog : null;
    }
    default:
      return true;
  }
}

export default async function Footer({ section }) {
  const { settings, blocks } = section;
  const theme = getSettings();
  const [{ shop, policies }, data] = await Promise.all([getShell(), Promise.all(blocks.map(load))]);
  const columns = blocks.map((block, index) => ({ block, data: data[index] })).filter((column) => column.data);
  const hasBrand = columns.some(({ block }) => block.type === 'brand');
  const columnCount = Math.max(1, columns.filter(({ block }) => block.type !== 'brand').length);

  return (
    <footer className={`site-footer color-${settings.color_scheme}`}>
      {columns.length > 0 && (
        <site-footer
          class={`site-footer__columns page-width${hasBrand ? ' site-footer__columns--brand' : ''}`}
          style={{ '--footer-columns': columnCount }}
        >
          {columns.map(({ block, data }) => {
            const s = block.settings;
            switch (block.type) {
              case 'brand':
                return (
                  <div key={block.id} className="site-footer__brand">
                    <Link href="/" className="site-footer__logo">
                      {theme.logo ? (
                        <ThemeImage
                          image={theme.logo}
                          widths={[s.logo_width, s.logo_width * 2]}
                          sizes={`${s.logo_width}px`}
                          width={s.logo_width}
                          alt={shop.name}
                        />
                      ) : (
                        <span className="h4">{shop.name}</span>
                      )}
                    </Link>
                    {s.text && <div className="site-footer__text" dangerouslySetInnerHTML={{ __html: s.text }} />}
                    {s.show_social && <SocialLinks />}
                  </div>
                );
              case 'menu':
                return (
                  <Column key={block.id} heading={s.heading}>
                    <nav aria-label={s.heading}>
                      <ul className="link-list" role="list">
                        {data.map((link) => (
                          <li key={link.id}>
                            <Link href={localPath(link.url)} className="link-list__link">
                              {link.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </Column>
                );
              case 'contacts':
                return (
                  <Column key={block.id} heading={s.heading}>
                    <StoreContacts />
                  </Column>
                );
              case 'products':
                return (
                  <Column key={block.id} heading={s.heading}>
                    <ul className="product-rows" role="list">
                      {data.map((product) => (
                        <ProductRow key={product.id} product={product} />
                      ))}
                    </ul>
                  </Column>
                );
              case 'articles':
                return (
                  <Column key={block.id} heading={s.heading || data.title}>
                    <ul className="site-footer__articles" role="list">
                      {data.articles.map((article) => {
                        const url = `/blogs/${data.handle}/${article.handle}`;
                        return (
                          <li key={article.handle} className="site-footer__article">
                            <Link
                              href={url}
                              className="frame site-footer__article-media"
                              style={{ '--frame-ratio': 1 }}
                              tabIndex={-1}
                              aria-hidden="true"
                            >
                              {article.image && <Image src={article.image.url} alt="" width={120} height={120} sizes="60px" />}
                            </Link>
                            <div className="site-footer__article-info">
                              <time dateTime={article.publishedAt.slice(0, 10)}>{formatDate(article.publishedAt)}</time>
                              <Link href={url} className="site-footer__article-title line-clamp">
                                {article.title}
                              </Link>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </Column>
                );
              default:
                return null;
            }
          })}
        </site-footer>
      )}

      <div className="site-footer__bottom page-width">
        <p className="site-footer__copyright">
          &copy; {new Date().getFullYear()} <Link href="/">{shop.name}</Link>
        </p>
        {settings.show_policies && policies.length > 0 && (
          <ul className="site-footer__policies" role="list">
            {policies.map((policy) => (
              <li key={policy.url}>
                <Link href={localPath(policy.url)}>{policy.title}</Link>
              </li>
            ))}
          </ul>
        )}
        {settings.show_back_to_top && (
          <a href="#" className="site-footer__top" data-back-to-top>
            {t('general.back_to_top')}
            <Icon name="arrow-right" />
          </a>
        )}
      </div>
    </footer>
  );
}
