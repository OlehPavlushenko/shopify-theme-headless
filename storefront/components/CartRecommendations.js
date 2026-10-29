// The recommendations panel next to the cart drawer: theme/sections/cart-drawer.liquid (cart-recs) — a
// vertical slider of compact rows filled by <cart-recommendations> (lib/cart-recommendations.js) from
// /recommendations. Theme settings > Cart > "Show recommendations".
import Icon from './Icon.js';
import SliderNav from './SliderNav.js';
import { getSettings, t } from '@/lib/theme.js';

export default function CartRecommendations() {
  if (getSettings().show_cart_recommendations === false) return null;
  const title = t('cart.recommendations.title');
  return (
    <cart-recommendations class="cart-recs" aria-labelledby="CartRecs-title" data-endpoint="/recommendations" inert="">
      <ui-slider class="slider slider--vertical cart-recs__slider" data-axis="y">
        <div className="slider__head">
          <p id="CartRecs-title" className="eyebrow">
            {title}
          </p>
          <div className="slider__head-end">
            <SliderNav label={title} />
            <button
              type="button"
              className="btn btn--icon cart-recs__close"
              data-recs-close=""
              aria-label={t('cart.recommendations.close')}
            >
              <Icon name="close" />
            </button>
          </div>
        </div>
        <ul className="scroll-track slider__track product-rows cart-recs__list" role="list" data-slider-track="" data-recs-list="" />
      </ui-slider>
    </cart-recommendations>
  );
}
