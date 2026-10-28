// Variant picker: the same markup as theme/snippets/variant-picker.liquid, but every value is a link to
// the product with that option picked (?Size=M&Color=Red) — no JS needed, each variant has its URL.
// A value whose combination with the other picks is sold out gets data-sold-out, one that doesn't exist
// data-missing (styles: .variant-picker in packages/ui/css/components.css).
import Link from 'next/link';

export default function VariantPicker({ product, selected }) {
  const picked = Object.fromEntries(selected.selectedOptions.map(({ name, value }) => [name, value]));
  const variantFor = (picks) =>
    product.variants.nodes.find((variant) => variant.selectedOptions.every(({ name, value }) => picks[name] === value));

  return (
    <div className="variant-picker">
      {product.options.map((option) => {
        const swatches = option.optionValues.some((value) => value.swatch?.color);
        return (
          <fieldset key={option.name} className="variant-picker__option">
            <legend className="variant-picker__legend">
              {option.name}: <span className="variant-picker__selected">{picked[option.name]}</span>
            </legend>
            <div className="variant-picker__values">
              {option.optionValues.map((value) => {
                const picks = { ...picked, [option.name]: value.name };
                const variant = variantFor(picks);
                const href = `/products/${product.handle}?${new URLSearchParams(picks)}`;
                return (
                  <Link
                    key={value.name}
                    href={href}
                    scroll={false}
                    replace
                    className={swatches ? 'variant-picker__swatch' : 'chip variant-picker__chip'}
                    aria-current={picked[option.name] === value.name ? 'true' : undefined}
                    data-missing={variant ? undefined : ''}
                    data-sold-out={variant && !variant.availableForSale ? '' : undefined}
                  >
                    {swatches ? (
                      <span className="swatch" style={{ '--swatch': value.swatch?.color ?? 'transparent' }} title={value.name}>
                        <span className="visually-hidden">{value.name}</span>
                      </span>
                    ) : (
                      value.name
                    )}
                  </Link>
                );
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
