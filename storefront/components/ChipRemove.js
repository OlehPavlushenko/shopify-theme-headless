// A removable chip in a list of active choices (filters, blog topics, search terms):
// theme/snippets/chip-remove.liquid — a link to the same page without that choice, its label and a ×.
// linkAttr: the attribute the page's script intercepts (data-facets-link, data-section-link).
import Icon from './Icon.js';

export default function ChipRemove({ url, label, ariaLabel, linkAttr }) {
  return (
    <li>
      <a href={url} className="chip chip--compact" {...(linkAttr && { [linkAttr]: '' })} aria-label={ariaLabel}>
        {label}
        <Icon name="close" />
      </a>
    </li>
  );
}
