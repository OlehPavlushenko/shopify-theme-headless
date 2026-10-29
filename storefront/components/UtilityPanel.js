// Utility panel: theme/snippets/utility-panel.liquid + utility-content.liquid — a "sliders" icon in the
// header opening a drawer on a manual popover (@ui/dialog) with account, wishlist and compare links
// (counters by @ui/saved-list) and the header's utility menu. Nothing, icon included, when empty.
// (The currency / language switchers come with Markets on the storefront.)
import CloseButton from './CloseButton.js';
import Icon from './Icon.js';
import { getMenu } from '@/lib/queries.js';
import { accountUrl, localPath } from '@/lib/shopify.js';
import { getSettings, t } from '@/lib/theme.js';

export default async function UtilityPanel({ settings, inMobileMenu }) {
  const theme = getSettings();
  const menu = await getMenu(settings.utility_menu);
  const links = [
    settings.show_account && accountUrl() && { href: accountUrl(), icon: 'account', label: t('customers.login.title') },
    settings.show_wishlist &&
      theme.wishlist_enabled !== false && { href: '/pages/wishlist', icon: 'heart', label: t('wishlist.title'), count: 'wishlist' },
    settings.show_compare &&
      theme.compare_enabled !== false && { href: '/pages/compare', icon: 'compare', label: t('compare.title'), count: 'compare' },
    ...menu.map((link) => ({ href: localPath(link.url), icon: 'arrow-right', label: link.title })),
  ].filter(Boolean);
  if (!links.length) return null;
  const title = t('accessibility.utility_panel');
  return (
    <>
      <button
        type="button"
        className={`btn btn--icon utility-panel__trigger${inMobileMenu ? ' utility-panel__trigger--desktop' : ''}`}
        popoverTarget="UtilityPanel"
        aria-label={title}
      >
        <Icon name="sliders" />
      </button>
      <div id="UtilityPanel" className="drawer utility-panel" popover="manual" aria-labelledby="UtilityPanel-title">
        <div className="drawer__inner">
          <div className="drawer__header">
            <p id="UtilityPanel-title" className="h5">
              {title}
            </p>
            <CloseButton popover="UtilityPanel" />
          </div>
          <div className="drawer__body utility-panel__body">
            <ul className="utility-panel__links" role="list">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="utility-panel__link">
                    <Icon name={link.icon} />
                    {link.label}
                    {link.count && <span className="count-badge saved-count" data-saved-count={link.count} data-empty="" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
