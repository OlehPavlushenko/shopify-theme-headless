// theme/sections/promo-grid.liquid: 1–3 promo cards side by side, a swipeable row on phones
import PromoCard, { promoCardProps } from '../PromoCard.js';
import SectionHead from '../SectionHead.js';

export default function PromoGrid({ section }) {
  const { settings, blocks } = section;
  return (
    <div className={`promo-grid color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <ui-slider
          class="slider promo-grid__slider"
          style={{ '--slider-columns': Math.min(3, Math.max(1, blocks.length)), '--slider-columns-mobile': 1.2 }}
        >
          <SectionHead heading={settings.heading} />
          <ul className="scroll-track slider__track" data-slider-track="" role="list">
            {blocks.map((block) => (
              <li key={block.id}>
                <PromoCard
                  {...promoCardProps(block.settings)}
                  layout={settings.card_layout}
                  ratio={settings.ratio}
                  sizes="(min-width: 750px) 33vw, 100vw"
                />
              </li>
            ))}
          </ul>
        </ui-slider>
      </div>
    </div>
  );
}
