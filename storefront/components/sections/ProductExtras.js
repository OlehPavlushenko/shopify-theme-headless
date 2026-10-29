// The product template's other sections, with the product from context:
// - ProductStory: theme/sections/product-story.liquid — key ingredients (metafield custom.key_ingredients,
//   "Name — what it does") as cards and how to use (custom.how_to_use) as numbered steps
// - ProductRecommendations: theme/sections/product-recommendations.liquid — Shopify's related products as a
//   slider of cards, rendered on the server (data-loaded: @ui/product doesn't fetch it again)
// - RecentlyViewed: theme/sections/recently-viewed.liquid — the browser's "recent" list (@ui/product records
//   it) through <saved-products> (@ui/saved-pages, cards from /saved), the current product left out
import Icon from '../Icon.js';
import ProductCard from '../ProductCard.js';
import SectionHead from '../SectionHead.js';
import { getProductRecommendations, listValue } from '@/lib/product.js';

export function ProductStory({ section, context = {} }) {
  const { id, settings } = section;
  const product = context.product;
  const ingredients = listValue(product?.keyIngredients);
  const steps = listValue(product?.howToUse);
  if (!ingredients.length && !steps.length) return null;
  return (
    <div className={`product-story color-${settings.color_scheme} section-spacing`}>
      <div className="page-width product-story__inner">
        {ingredients.length > 0 && (
          <section className="product-story__part" aria-labelledby={`StoryIngredients-${id}`}>
            <p className="eyebrow">{settings.ingredients_eyebrow}</p>
            <h2 id={`StoryIngredients-${id}`} className="h3">
              {settings.ingredients_heading}
            </h2>
            <ul className="product-story__ingredients" role="list">
              {ingredients.map((item) => {
                const [name, ...rest] = item.split(' — ');
                return (
                  <li key={item} className="card product-story__ingredient">
                    <Icon name="leaf" />
                    <p className="product-story__ingredient-name">{name}</p>
                    {rest.length > 0 && <p className="product-story__ingredient-text">{rest.join(' — ')}</p>}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
        {steps.length > 0 && (
          <section className="product-story__part product-story__part--steps" aria-labelledby={`StorySteps-${id}`}>
            <p className="eyebrow">{settings.steps_eyebrow}</p>
            <h2 id={`StorySteps-${id}`} className="h3">
              {settings.steps_heading}
            </h2>
            <ol className="product-story__steps" role="list">
              {steps.map((step, index) => (
                <li key={step} className="product-story__step">
                  <span className="product-story__step-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <p>{step}</p>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}

export async function ProductRecommendations({ section, context = {} }) {
  const { settings } = section;
  if (!context.product) return null;
  const products = (await getProductRecommendations(context.product.handle, 'RELATED')).slice(0, settings.limit);
  if (!products.length) return null;
  return (
    <product-recommendations class={`product-list color-${settings.color_scheme} section-spacing`} data-loaded="">
      <div className="page-width">
        <ui-slider class="slider product-list__slider" style={{ '--slider-columns': settings.columns, '--slider-columns-mobile': 2.2 }}>
          <SectionHead heading={settings.heading} nav />
          <ul className="scroll-track slider__track" data-slider-track role="list">
            {products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} quickAdd sizes="(min-width: 990px) 22vw, 45vw" />
              </li>
            ))}
          </ul>
        </ui-slider>
      </div>
    </product-recommendations>
  );
}

export function RecentlyViewed({ section, context = {} }) {
  const { settings } = section;
  return (
    <div className={`product-list recently-viewed color-${settings.color_scheme} section-spacing`}>
      <saved-products
        class="page-width"
        data-list="recent"
        data-section="saved-product"
        data-endpoint="/saved"
        data-exclude={context.product?.handle}
        data-limit={settings.limit}
        data-state="loading"
      >
        <ui-slider class="slider product-list__slider" style={{ '--slider-columns': settings.columns, '--slider-columns-mobile': 2.2 }}>
          <SectionHead heading={settings.heading} nav />
          <ul className="scroll-track slider__track" data-slider-track role="list" data-saved-products="" />
        </ui-slider>
        <div data-saved-empty="" />
      </saved-products>
    </div>
  );
}
