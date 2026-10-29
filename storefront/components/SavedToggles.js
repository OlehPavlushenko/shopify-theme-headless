// Wishlist and compare buttons of a product (<saved-toggle>, @ui/saved-list): theme/snippets/saved-toggles.liquid,
// shown when they are on in Theme settings > Wishlist & compare. Styles: packages/ui/css/saved.css.
import Icon from './Icon.js';
import { getSettings, t } from '@/lib/theme.js';

export default function SavedToggles({ product, className }) {
  const settings = getSettings();
  if (!settings.wishlist_enabled && !settings.compare_enabled) return null;
  const item = {
    'data-handle': product.handle,
    'data-title': product.title,
    'data-image': product.featuredImage ? `${product.featuredImage.url}&width=160` : '',
    'data-url': `/products/${product.handle}`,
  };
  return (
    <div className={`saved-toggles${className ? ` ${className}` : ''}`}>
      {settings.wishlist_enabled && (
        <saved-toggle data-list="wishlist" {...item}>
          <button type="button" className="saved-toggle" aria-pressed="false" aria-label={t('wishlist.toggle', { product: product.title })}>
            <Icon name="heart" />
          </button>
        </saved-toggle>
      )}
      {settings.compare_enabled && (
        <saved-toggle data-list="compare" {...item}>
          <button type="button" className="saved-toggle" aria-pressed="false" aria-label={t('compare.toggle', { product: product.title })}>
            <Icon name="compare" />
          </button>
        </saved-toggle>
      )}
    </div>
  );
}
