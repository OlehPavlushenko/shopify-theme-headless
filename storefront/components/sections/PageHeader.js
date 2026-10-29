// theme/sections/page-header.liquid: breadcrumbs, the page's h1 (the setting, or the page / collection
// title), an intro (the setting, or the collection's description), an optional image beside the text
// ("split") or behind it under a tint ("cover"), the saved list's counter on the wishlist / compare pages,
// subcollections as chips. context: { template, suffix, page, collection, subcollections }.
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '../Breadcrumbs.js';
import ThemeImage from '../ThemeImage.js';
import { t } from '@/lib/theme.js';

function headingFor(settings, { template, page, collection }) {
  if (settings.heading) return settings.heading;
  if (template === 'collection') return collection?.title;
  if (template === 'list-collections') return t('general.collections');
  if (template === 'search') return t('search.title');
  return page?.title;
}

function trailFor({ template, collection }) {
  if (template === 'collection' && collection?.handle !== 'all') return [{ title: t('general.collections'), url: '/collections' }];
  return [];
}

export default function PageHeader({ section, context = {} }) {
  const { settings } = section;
  const { template, suffix, collection, subcollections = [] } = context;
  const heading = headingFor(settings, context);
  const text = settings.text || (template === 'collection' ? collection?.descriptionHtml : '');
  // A picked image, or the collection's own
  const image = settings.image || (settings.image_source === 'collection' && template === 'collection' ? collection?.image?.url : null);
  const media = image && settings.image_layout !== 'none' ? settings.image_layout : 'none';

  return (
    <div className={`page-header page-header--${settings.alignment} page-header--media-${media} color-${settings.color_scheme}`}>
      {media === 'cover' && (
        <div className="frame frame--cover page-header__cover" style={{ '--page-header-tint': `${settings.tint}%` }}>
          <ThemeImage image={image} widths={[750, 1200, 1800, 2400]} sizes="100vw" loading="eager" fetchPriority="high" />
        </div>
      )}
      <div className="page-header__inner page-width">
        <div className="page-header__text-col">
          {settings.breadcrumbs && <Breadcrumbs className="page-header__breadcrumbs" trail={trailFor(context)} current={heading} />}
          <h1 className="h1 page-header__heading" dangerouslySetInnerHTML={{ __html: heading }} />
          {text && <div className="text-lead page-header__text" dangerouslySetInnerHTML={{ __html: text }} />}
          {(suffix === 'wishlist' || suffix === 'compare') && (
            <p
              className="page-header__counter"
              data-saved-counter={suffix}
              data-one={t('general.products_count', { count: 1 })}
              data-other={t('general.products_count', { count: '%n' })}
              data-empty=""
            />
          )}
          {settings.subcollections && subcollections.length > 0 && (
            <nav className="page-header__subcollections" aria-label={t('collections.subcollections')}>
              <ul className="subcollections scrollbar-hidden" role="list">
                {subcollections.map((sub) => {
                  const thumb = sub.image ?? sub.products.nodes[0]?.featuredImage;
                  return (
                    <li key={sub.handle}>
                      <Link
                        href={`/collections/${sub.handle}`}
                        className="subcollection"
                        aria-current={sub.handle === collection?.handle ? 'page' : undefined}
                      >
                        {thumb && <Image className="subcollection__image" src={thumb.url} alt="" width={48} height={48} sizes="48px" />}
                        <span className="subcollection__title">{sub.title}</span>
                        <span className="subcollection__count">{sub.productsCount}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}
        </div>
        {media === 'split' && (
          <div className="frame page-header__media" style={{ '--frame-ratio': '4 / 3' }}>
            <ThemeImage
              image={image}
              widths={[600, 900, 1200, 1400]}
              sizes="(min-width: 990px) 40vw, 100vw"
              loading="eager"
              fetchPriority="high"
            />
          </div>
        )}
      </div>
    </div>
  );
}
