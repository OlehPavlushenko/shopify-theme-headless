// theme/sections/cookie-banner.liquid: tracking consent through Shopify's Customer Privacy API
// (<cookie-banner>, @ui/cookie-banner) — shown where Shopify says consent is needed, and from the
// footer's "Cookie preferences". Headless: the API's script is loaded by the element (data-api-src) and
// every answer carries the headless storefront's domains (data-consent), as Shopify asks of a headless store.
import { SITE_URL, STORE_DOMAIN } from '@/lib/env.js';
import { t } from '@/lib/theme.js';

const API_SRC = 'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js';
const PURPOSES = ['analytics', 'marketing', 'preferences'];

export default function CookieBanner({ section }) {
  const { settings } = section;
  const site = SITE_URL ? new URL(SITE_URL).hostname : undefined;
  const consent = { headlessStorefront: true, checkoutRootDomain: STORE_DOMAIN, storefrontRootDomain: site };
  return (
    <cookie-banner
      class={`cookie-banner color-${settings.color_scheme}`}
      role="region"
      aria-labelledby={`CookieBanner-${section.id}`}
      data-api-src={API_SRC}
      data-consent={JSON.stringify(consent)}
      hidden
    >
      <div className="cookie-banner__text">
        <h2 className="h5 cookie-banner__heading" id={`CookieBanner-${section.id}`}>
          {settings.heading}
        </h2>
        <div className="cookie-banner__body" dangerouslySetInnerHTML={{ __html: settings.text ?? '' }} />
      </div>

      <form className="cookie-banner__choices" data-cookie-choices="" hidden>
        {PURPOSES.map((key) => (
          <label key={key} className="cookie-banner__choice">
            <input type="checkbox" className="switch" name={key} defaultChecked />
            <span>
              <span className="cookie-banner__choice-title">{t(`cookies.${key}`)}</span>
              <span className="cookie-banner__choice-text">{t(`cookies.${key}_text`)}</span>
            </span>
          </label>
        ))}
      </form>

      <div className="cookie-banner__actions">
        <button type="button" className="btn btn--sm" data-consent="accept">
          {t('cookies.accept')}
        </button>
        <button type="button" className="btn btn--outline btn--sm" data-consent="decline">
          {t('cookies.decline')}
        </button>
        <button type="button" className="btn btn--link cookie-banner__manage" data-consent="manage" aria-expanded="false">
          {t('cookies.manage')}
        </button>
        <button type="button" className="btn btn--sm" data-consent="save" hidden>
          {t('cookies.save')}
        </button>
      </div>
    </cookie-banner>
  );
}
