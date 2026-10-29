// The visitor's country and language (Shopify Markets), as the theme's localization form sets them: kept in
// cookies by the localization server action (app/actions.js setLocalization); every Storefront API request
// asks in that context (@inContext, lib/shopify.js), so prices come in the country's currency.
import { cookies } from 'next/headers';

export const COUNTRY_COOKIE = 'country';
export const LANGUAGE_COOKIE = 'language';

// { country, language } (ISO codes, uppercase) or {} — also outside a request (build, sitemap)
export async function currentLocale() {
  try {
    const jar = await cookies();
    const country = jar.get(COUNTRY_COOKIE)?.value;
    const language = jar.get(LANGUAGE_COOKIE)?.value;
    return {
      ...(/^[A-Z]{2}$/.test(country ?? '') && { country }),
      ...(/^[A-Z]{2}(_[A-Z]{2})?$/.test(language ?? '') && { language }),
    };
  } catch {
    return {};
  }
}
