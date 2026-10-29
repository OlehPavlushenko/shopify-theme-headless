// A color swatch: theme/snippets/swatch.liquid — Shopify's swatch (image, else color), else the value's name
// as a CSS color; and theme/snippets/option-is-color — whether an option (or a filter) shows swatches.
// value: an option value { name, swatch } or a filter value { label, swatch }.
const COLOR_NAMES = ['color', 'colour', 'колір', 'цвет'];

export function isColorOption(option) {
  const name = (option.name ?? option.label ?? '').toLowerCase();
  const values = option.optionValues ?? option.values ?? [];
  return COLOR_NAMES.includes(name) || Boolean(values[0]?.swatch) || option.presentation === 'SWATCH';
}

export default function Swatch({ value, className }) {
  const label = value.label ?? value.name;
  const image = value.swatch?.image?.previewImage?.url;
  const background = image ? `url(${image}&width=64)` : value.swatch?.color || label.toLowerCase().replace(/[^a-z]/g, '');
  return (
    <span className={className ? `swatch ${className}` : 'swatch'} style={{ '--swatch': background }} title={label}>
      <span className="visually-hidden">{label}</span>
    </span>
  );
}
