// theme/sections/main-list-collections.liquid: every collection with products, minus those marked hidden
// (metafield theme.hidden), as editorial rows, a bento mosaic (featured ones — theme.featured, else the
// first — large) or collection cards
import Image from 'next/image';
import Link from 'next/link';
import CollectionCard from '../CollectionCard.js';
import Icon from '../Icon.js';
import { getCollectionList } from '@/lib/collection.js';
import { truncateWords } from '@/lib/text.js';
import { t } from '@/lib/theme.js';

function Row({ collection, index }) {
  return (
    <li>
      <Link href={`/collections/${collection.handle}`} className="collection-row">
        <span className="collection-row__index" aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
        <span className="collection-row__text">
          <span className="h2 collection-row__title">{collection.title}</span>
          {collection.description && <span className="collection-row__description">{truncateWords(collection.description, 26)}</span>}
          <span className="collection-row__count">{t('collections.product_count', { count: collection.productsCount })}</span>
        </span>
        <span className="collection-row__products" aria-hidden="true">
          {collection.products.nodes.map(({ featuredImage: image }, i) => (
            <span key={i} className="frame collection-row__thumb" style={{ '--frame-ratio': 1 }}>
              {image && <Image src={image.url} alt="" width={image.width} height={image.height} sizes="(min-width: 990px) 120px, 22vw" />}
            </span>
          ))}
        </span>
        <span className="link-arrow collection-row__cta" aria-hidden="true">
          {t('collections.shop')}
          <Icon name="arrow-right" />
        </span>
      </Link>
    </li>
  );
}

function Tile({ collection, index, large }) {
  const cover = collection.image ?? collection.products.nodes[0]?.featuredImage;
  // The first large tile is the page's main image
  const main = large && index === 1;
  return (
    <li className={`collection-tile${large ? ' collection-tile--large' : ''}`}>
      <Link href={`/collections/${collection.handle}`} className="collection-tile__link">
        <span className="frame frame--cover collection-tile__media">
          {cover && (
            <Image
              src={cover.url}
              alt=""
              width={cover.width}
              height={cover.height}
              sizes={large ? '(min-width: 990px) 50vw, 100vw' : '(min-width: 990px) 25vw, 50vw'}
              priority={main}
            />
          )}
        </span>
        <span className="collection-tile__caption">
          <span className="collection-tile__count">{t('collections.product_count', { count: collection.productsCount })}</span>
          <span className={`${large ? 'h2' : 'h4'} collection-tile__title`}>
            {collection.title}
            <Icon name="arrow-right" />
          </span>
          {large && collection.description && (
            <span className="collection-tile__description">{truncateWords(collection.description, 18)}</span>
          )}
        </span>
      </Link>
    </li>
  );
}

export default async function MainListCollections({ section }) {
  const { settings } = section;
  let list = await getCollectionList();
  if (settings.sort === 'products') list = [...list].sort((a, b) => b.productsCount - a.productsCount);
  const anyFeatured = list.some((collection) => collection.featured);
  const shown = list.filter((collection) => !collection.hidden && collection.productsCount > 0);
  const { layout } = settings;
  return (
    <div className={`main-collections main-collections--${layout} color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <ul
          className={`main-collections__list${layout === 'grid' ? ' grid main-collections__grid' : ''}`}
          role="list"
          style={layout === 'grid' ? { '--grid-columns': settings.columns, '--grid-columns-mobile': 2 } : undefined}
        >
          {shown.map((collection, i) => {
            const index = i + 1;
            if (layout === 'editorial') return <Row key={collection.handle} collection={collection} index={index} />;
            if (layout === 'bento') {
              const large = collection.featured || (!anyFeatured && index === 1);
              return <Tile key={collection.handle} collection={collection} index={index} large={large} />;
            }
            return (
              <li key={collection.handle}>
                <CollectionCard collection={collection} ratio={settings.ratio} sizes="(min-width: 990px) 25vw, 50vw" />
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
