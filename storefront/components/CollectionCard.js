// Collection card: the same markup as theme/snippets/collection-card.liquid — cover (the collection's
// image or its first product's), title with an arrow on its last word, product count.
// Styles: packages/ui/css/sections.css.
import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon.js';
import { t } from '@/lib/theme.js';

export default function CollectionCard({ collection, ratio = '1', sizes = '(min-width: 990px) 25vw, 50vw' }) {
  const cover = collection.image ?? collection.products.nodes[0]?.featuredImage;
  const words = collection.title.split(' ');
  const last = words.pop();
  return (
    <Link href={`/collections/${collection.handle}`} className="collection-card">
      <span className="frame collection-card__media" style={{ '--frame-ratio': ratio }}>
        {cover && <Image src={cover.url} alt="" width={cover.width} height={cover.height} sizes={sizes} />}
      </span>
      <span className="collection-card__title">
        {words.length > 0 && `${words.join(' ')} `}
        <span className="collection-card__title-end">
          {last}
          <Icon name="arrow-right" />
        </span>
      </span>
      {collection.productsCount !== undefined && (
        <span className="collection-card__count">{t('collections.product_count', { count: collection.productsCount })}</span>
      )}
    </Link>
  );
}
