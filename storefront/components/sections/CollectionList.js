// theme/sections/collection-list.liquid: collection tiles in a slider (a full row on wide screens).
// Picked collections as picked; without them, the store's collections (up to 12).
import CollectionCard from '../CollectionCard.js';
import SectionHead from '../SectionHead.js';
import { getCollections, getCollectionsByHandles } from '@/lib/queries.js';

export default async function CollectionList({ section }) {
  const { settings } = section;
  const list = settings.collections?.length ? await getCollectionsByHandles(settings.collections) : (await getCollections()).slice(0, 12);
  return (
    <div className={`collection-list color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <ui-slider class="slider" style={{ '--slider-columns': settings.columns, '--slider-columns-mobile': 1.6 }}>
          <SectionHead heading={settings.heading} linkLabel={settings.link_label} link="/collections" nav />
          <ul className="scroll-track slider__track" data-slider-track role="list">
            {list.map((collection) => (
              <li key={collection.handle}>
                <CollectionCard collection={collection} ratio={settings.ratio} sizes="(min-width: 990px) 25vw, 60vw" />
              </li>
            ))}
          </ul>
        </ui-slider>
      </div>
    </div>
  );
}
