// Utility panel: theme/snippets/utility-panel.liquid + utility-content.liquid — a "sliders" icon in the
// header opening a drawer on a manual popover (@ui/dialog) with account, wishlist and compare links
// (counters by @ui/saved-list), the header's utility menu and the currency / language switchers (Shopify
// Markets). The same content ends the mobile menu's root panel. Nothing, icon included, when empty.
import CloseButton from './CloseButton.js';
import Icon from './Icon.js';
import LocalizationForm from './LocalizationForm.js';
import { getLocalization, getMenu } from '@/lib/queries.js';
import { accountUrl, localPath } from '@/lib/shopify.js';
import { getSettings, t } from '@/lib/theme.js';

// The links and the switchers' data; null when there is nothing to show
async function utilityData(settings) {
  const theme = getSettings();
  const [menu, localization] = await Promise.all([
    getMenu(settings.utility_menu),
    settings.show_currency || settings.show_language ? getLocalization() : null,
  ]);
  const links = [
    settings.show_account && accountUrl() && { href: accountUrl(), icon: 'account', label: t('customers.login.title') },
    settings.show_wishlist &&
      theme.wishlist_enabled !== false && { href: '/pages/wishlist', icon: 'heart', label: t('wishlist.title'), count: 'wishlist' },
    settings.show_compare &&
      theme.compare_enabled !== false && { href: '/pages/compare', icon: 'compare', label: t('compare.title'), count: 'compare' },
    ...menu.map((link) => ({ href: localPath(link.url), icon: 'arrow-right', label: link.title })),
  ].filter(Boolean);
  const currencies = new Set(localization?.availableCountries.map((item) => item.currency.isoCode)).size;
  const showCurrency = Boolean(settings.show_currency && currencies > 1);
  const showLanguage = Boolean(settings.show_language && localization?.availableLanguages.length > 1);
  if (!links.length && !showCurrency && !showLanguage) return null;
  return { links, localization, showCurrency, showLanguage };
}

export const hasUtility = async (settings) => Boolean(await utilityData(settings));

// snippets/utility-content: the links, then the switchers (id: a prefix for the form ids)
export async function UtilityContent({ settings, id }) {
  const data = await utilityData(settings);
  if (!data) return null;
  return (
    <>
      {data.links.length > 0 && (
        <ul className="utility-panel__links" role="list">
          {data.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="utility-panel__link">
                <Icon name={link.icon} />
                {link.label}
                {link.count && <span className="count-badge saved-count" data-saved-count={link.count} data-empty="" />}
              </a>
            </li>
          ))}
        </ul>
      )}
      {data.showCurrency && <LocalizationForm type="currency" id={id} localization={data.localization} />}
      {data.showLanguage && <LocalizationForm type="language" id={id} localization={data.localization} />}
    </>
  );
}

export default async function UtilityPanel({ settings, inMobileMenu }) {
  if (!(await utilityData(settings))) return null;
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
            <UtilityContent settings={settings} id="UtilityPanel" />
          </div>
        </div>
      </div>
    </>
  );
}
