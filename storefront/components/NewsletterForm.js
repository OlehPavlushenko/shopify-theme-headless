// Newsletter sign-up: theme/snippets/newsletter-form.liquid with the API (<newsletter-form>, @ui/newsletter,
// project-server POST /newsletter at Theme settings > Integrations > API URL). The headless storefront
// has no Shopify customer form to fall back to: without the API URL the form is not rendered.
import Icon from './Icon.js';
import { apiUrl, getSettings, t } from '@/lib/theme.js';

export default function NewsletterForm({ id, buttonLabel, successText, alreadyText, discountCode, note }) {
  const settings = getSettings();
  const api = apiUrl();
  if (!api) return null;
  const formId = `Newsletter-${id}`;
  return (
    <newsletter-form
      class="newsletter-form"
      data-endpoint={`${api}/newsletter`}
      data-recaptcha={settings.recaptcha_site_key || undefined}
      data-discount={discountCode?.trim() || undefined}
      data-message-invalid={t('newsletter.invalid_email')}
      data-message-error={t('newsletter.error')}
    >
      <form id={formId} className="newsletter-form__form" noValidate>
        <div className="newsletter-form__row" data-newsletter-fields="">
          <span className="newsletter-form__field">
            <Icon name="mail" />
            <input
              className="input"
              type="email"
              name="contact[email]"
              id={`${formId}-email`}
              autoComplete="email"
              required
              placeholder={t('newsletter.placeholder')}
              aria-label={t('newsletter.placeholder')}
              aria-describedby={`${formId}-message`}
            />
          </span>
          <button type="submit" className="btn">
            {buttonLabel || t('newsletter.subscribe')}
          </button>
        </div>
        <template data-newsletter-success="" dangerouslySetInnerHTML={{ __html: successText || t('newsletter.success') }} />
        <template data-newsletter-already="" dangerouslySetInnerHTML={{ __html: alreadyText || t('newsletter.already') }} />
        <p className="form-error newsletter-form__message" id={`${formId}-message`} data-newsletter-message="" aria-live="polite" />
      </form>
      {note && <p className="newsletter-form__note" dangerouslySetInnerHTML={{ __html: note }} />}
    </newsletter-form>
  );
}
