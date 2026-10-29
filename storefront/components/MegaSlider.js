// The "Menu products" block of a mega menu: theme/snippets/mega-menu-block.liquid (a <ui-slider> of
// small product cards, no actions, no second image)
import ProductCard from './ProductCard.js';
import SliderNav from './SliderNav.js';
import { getProductsByHandles } from '@/lib/queries.js';

export default async function MegaSlider({ heading, handles }) {
  const products = await getProductsByHandles(handles);
  if (!products.length) return null;
  return (
    <ui-slider class="slider mega-slider">
      <div className="slider__head">
        <p className="eyebrow">{heading}</p>
        <div className="slider__head-end">
          <SliderNav label={heading} />
        </div>
      </div>
      <ul className="scroll-track slider__track" data-slider-track role="list">
        {products.map((product) => (
          <li key={product.id}>
            <ProductCard product={product} headingTag="p" actions={false} secondImage={false} sizes="(min-width: 990px) 200px, 45vw" />
          </li>
        ))}
      </ul>
    </ui-slider>
  );
}
