/**
 * <cookie-banner hidden> — tracking consent through Shopify's Customer Privacy API
 * (sections/cookie-banner.liquid).
 *
 * Shopify decides whether it shows (customerPrivacy.shouldShowBanner(): a region that needs consent
 * and no answer yet) and stores the answer; Customer events pixels follow it.
 * - [data-consent="accept"] / "decline": everything on / off.
 * - [data-consent="manage"]: shows [data-cookie-choices] (a checkbox per purpose: analytics,
 *   marketing, preferences) and [data-consent="save"], which sends them.
 * - Any [data-cookie-settings] on the page (the footer's "Cookie preferences") opens it again; they
 *   are shown once the API is there.
 * In the theme editor it shows while its section is selected.
 */
const PURPOSES = ['analytics', 'marketing', 'preferences'];

// Shopify's Customer Privacy API (null where it doesn't come). Requested after the page has loaded
// (Shopify's loader may not be ready while it is parsed, and its callback isn't always called), then
// waited for until it is there, 10 s at most.
const PRIVACY_WAIT = 10_000;
function loadPrivacy() {
  return new Promise((resolve) => {
    const request = () => window.Shopify?.loadFeatures?.([{ name: 'consent-tracking-api', version: '0.1' }], () => {});
    if (document.readyState === 'complete') request();
    else addEventListener('load', request, { once: true });
    const started = Date.now();
    const check = () => {
      if (window.Shopify?.customerPrivacy) return resolve(window.Shopify.customerPrivacy);
      if (Date.now() - started > PRIVACY_WAIT) return resolve(null);
      setTimeout(check, 200);
    };
    check();
  });
}

class CookieBanner extends HTMLElement {
  #abort;
  #privacy;

  async connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.choices = this.querySelector('[data-cookie-choices]');
    this.addEventListener('click', this.#onClick, { signal });

    if (window.Shopify?.designMode) {
      const section = this.closest('.shopify-section');
      document.addEventListener('shopify:section:select', (event) => event.target === section && (this.hidden = false), { signal });
      document.addEventListener('shopify:section:deselect', (event) => event.target === section && (this.hidden = true), { signal });
    }

    this.#privacy = await loadPrivacy();
    if (!this.#privacy || signal.aborted) return;
    // The banner may run before the footer is parsed: links are shown once the page is, clicks delegated
    const reveal = () => document.querySelectorAll('[data-cookie-settings]').forEach((link) => (link.hidden = false));
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', reveal, { once: true, signal });
    else reveal();
    document.addEventListener('click', this.#onSettings, { signal });
    if (this.#privacy.shouldShowBanner()) this.#open(false);
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onSettings = (event) => {
    if (event.target.closest('[data-cookie-settings]')) this.#open(true);
  };

  #open(manage) {
    this.hidden = false;
    this.#manage(manage);
    this.querySelector('[data-consent="accept"]')?.focus({ preventScroll: true });
  }

  // Preferences open: the switches, then Accept + Save choices (Decline and the toggle step aside)
  #manage(show) {
    this.choices.hidden = !show;
    this.querySelector('[data-consent="save"]').hidden = !show;
    this.querySelector('[data-consent="decline"]').hidden = show;
    const toggle = this.querySelector('[data-consent="manage"]');
    toggle.hidden = show;
    toggle.setAttribute('aria-expanded', String(show));
  }

  #onClick = (event) => {
    const action = event.target.closest('[data-consent]')?.dataset.consent;
    if (!action) return;
    if (action === 'manage') return this.#manage(this.choices.hidden);
    const all = action === 'accept';
    const consent = Object.fromEntries(
      PURPOSES.map((purpose) => [purpose, action === 'save' ? this.choices.elements[purpose].checked : all])
    );
    // The sale of data follows marketing
    consent.sale_of_data = consent.marketing;
    this.hidden = true;
    this.#privacy?.setTrackingConsent(consent, () => {});
  };
}

if (!customElements.get('cookie-banner')) customElements.define('cookie-banner', CookieBanner);
