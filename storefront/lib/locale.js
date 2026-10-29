// The visitor's country and language (Shopify Markets), as the theme's localization form sets them: kept in
// cookies by the localization server action (app/actions.js setLocalization); every Storefront API request
// asks in that context (@inContext, lib/shopify.js), so prices come in the country's currency.
import { cookies } from 'next/headers';

export const COUNTRY_COOKIE = 'country';
export const LANGUAGE_COOKIE = 'language';

// Valid codes: a country (ISO 3166, "MX") and a language ("EN", "PT_BR"), uppercase
export const isCountry = (code) => /^[A-Z]{2}$/.test(code ?? '');
export const isLanguage = (code) => /^[A-Z]{2}(_[A-Z]{2})?$/.test(code ?? '');

// { country, language } (ISO codes, uppercase) or {} — also outside a request (build, sitemap)
export async function currentLocale() {
  try {
    const jar = await cookies();
    const country = jar.get(COUNTRY_COOKIE)?.value;
    const language = jar.get(LANGUAGE_COOKIE)?.value;
    return {
      ...(isCountry(country) && { country }),
      ...(isLanguage(language) && { language }),
    };
  } catch {
    return {};
  }
}
