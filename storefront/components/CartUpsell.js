// "You may also like": theme/snippets/cart-upsell.liquid — Theme settings > Cart > "Upsell products"
// (sold-out ones left out) as product cards with quick add in a slider; 2 columns in the drawer, 4 on
// the cart page (modifier "page"). The cart drawer / page hide the ones already in the cart
// (li[data-product-handle]).
import ProductCard from './ProductCard.js';
import SliderNav from './SliderNav.js';
import { getProductsByHandles } from '@/lib/queries.js';
import { getSettings, t } from '@/lib/theme.js';

export default async function CartUpsell({ modifier }) {
  const settings = getSettings();
  if (settings.show_upsell === false || !settings.upsell_products?.length) return null;
  const products = (await getProductsByHandles(settings.upsell_products)).filter((product) => product.availableForSale);
  if (!products.length) return null;
  const title = t('cart.upsell_title');
  return (
    <ui-slider class={`slider cart-upsell${modifier ? ` cart-upsell--${modifier}` : ''}`} aria-label={title}>
      <div className="slider__head">
        <h2 className="eyebrow">{title}</h2>
        <div className="slider__head-end">
          <SliderNav label={title} />
        </div>
      </div>
      <ul className="scroll-track slider__track" data-slider-track role="list">
        {products.map((product) => (
          <li key={product.id} data-product-handle={product.handle}>
            <ProductCard
              product={product}
              quickAdd
              secondImage={false}
              headingTag="p"
              actions={false}
              sizes="(min-width: 990px) 200px, 45vw"
            />
          </li>
        ))}
      </ul>
    </ui-slider>
  );
}
