// The currency or language switcher: theme/snippets/localization-form.liquid — chips that submit the country
// (for a currency) or the language to the localization server action (app/actions.js setLocalization),
// no JS needed. Nothing when there is only one option. localization: lib/queries.js getLocalization.
import { setLocalization } from '@/app/actions.js';
import { t } from '@/lib/theme.js';

// The country to submit for a currency, the least disruptive one: the current country, else one whose
// languages include the current language, else the first with that currency
function countryFor(code, localization) {
  const { country, language, availableCountries: countries } = localization;
  if (country.currency.isoCode === code) return country;
  const withCurrency = countries.filter((item) => item.currency.isoCode === code);
  return withCurrency.find((item) => item.availableLanguages.some((lang) => lang.isoCode === language.isoCode)) ?? withCurrency[0];
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export default function LocalizationForm({ type, id = 'Localization', localization }) {
  if (!localization) return null;
  if (type === 'currency') {
    const codes = [...new Set(localization.availableCountries.map((item) => item.currency.isoCode))];
    if (codes.length < 2) return null;
    return (
      <form action={setLocalization} id={`${id}-currency`} className="localization">
        <p className="eyebrow">{t('localization.currency')}</p>
        <div className="localization__options">
          {codes.map((code) => {
            const target = countryFor(code, localization);
            return (
              <button
                key={code}
                type="submit"
                name="country_code"
                value={target.isoCode}
                className="chip"
                aria-pressed={localization.country.currency.isoCode === code ? 'true' : 'false'}
              >
                {code} {target.currency.symbol}
              </button>
            );
          })}
        </div>
      </form>
    );
  }
  const languages = localization.availableLanguages;
  if (languages.length < 2) return null;
  return (
    <form action={setLocalization} id={`${id}-language`} className="localization">
      <p className="eyebrow">{t('localization.language')}</p>
      <div className="localization__options">
        {languages.map((language) => (
          <button
            key={language.isoCode}
            type="submit"
            name="language_code"
            value={language.isoCode}
            lang={language.isoCode.toLowerCase()}
            className="chip"
            aria-pressed={language.isoCode === localization.language.isoCode ? 'true' : 'false'}
          >
            {capitalize(language.endonymName)}
          </button>
        ))}
      </div>
    </form>
  );
}
