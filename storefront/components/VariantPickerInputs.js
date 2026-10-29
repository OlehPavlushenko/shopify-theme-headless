// Linked option pickers: theme/snippets/variant-picker.liquid — radios in chips (or swatches) per option
// and the variants as JSON in the shape @ui/variant-picker reads (Shopify's: numeric ids, prices in
// cents, options in order, featured_media.id). Used where the picker works in place (quick view,
// the product page form); <product-info> around it follows the picks.
import Swatch, { isColorOption } from './Swatch.js';
import { numericId } from '@/lib/ids.js';
import { scriptJson } from '@/lib/text.js';

const cents = (money) => (money ? Math.round(Number(money.amount) * 100) : 0);

// product: options { name, optionValues { name swatch } }, variants { id availableForSale selectedOptions
// price compareAtPrice image { id } }
function variantsJson(product) {
  return product.variants.nodes.map((variant) => ({
    id: numericId(variant.id),
    options: product.options.map((option) => variant.selectedOptions.find((selected) => selected.name === option.name)?.value),
    available: variant.availableForSale,
    price: cents(variant.price),
    compare_at_price: cents(variant.compareAtPrice),
    featured_media: variant.image ? { id: numericId(variant.image.id) } : null,
    stock: null,
  }));
}

export default function VariantPickerInputs({ product, selected, id }) {
  const picked = Object.fromEntries(selected.selectedOptions.map(({ name, value }) => [name, value]));
  return (
    <variant-picker class="variant-picker">
      {product.options.map((option, position) => {
        const swatches = isColorOption(option);
        return (
          <fieldset key={option.name} className="variant-picker__option">
            <legend className="variant-picker__legend">
              {option.name}:{' '}
              <span className="variant-picker__selected" data-selected-value="">
                {picked[option.name]}
              </span>
            </legend>
            <div className="variant-picker__values">
              {option.optionValues.map((value) => (
                <label key={value.name} className={swatches ? 'variant-picker__swatch' : 'chip variant-picker__chip'}>
                  <input
                    type="radio"
                    className="visually-hidden"
                    name={`${id}-option-${position + 1}`}
                    value={value.name}
                    defaultChecked={picked[option.name] === value.name}
                  />
                  {swatches ? <Swatch value={value} /> : value.name}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      <script
        type="application/json"
        data-variants=""
        dangerouslySetInnerHTML={{ __html: scriptJson(JSON.stringify(variantsJson(product))) }}
      />
    </variant-picker>
  );
}
