// A form sent as JSON to project-server: theme/snippets/contact-form.liquid with the API URL (<contact-form>,
// @ui/contact-form, checked by <form-validate>; the success line in a template). The headless storefront
// has no Shopify contact form to fall back to: without Theme settings > Integrations > API URL nothing renders.
// Fields: the contact fields (name, email, [phone], message) by default, or `fields`.
import { iconHtml } from './Icon.js';
import { escapeHtml } from '@/lib/text.js';
import { getSettings, t } from '@/lib/theme.js';

// The success notice (snippets/form-success) as an HTML string: a <template>'s children live in
// template.content, so React renders them through dangerouslySetInnerHTML to hydrate
const successHtml = (text) => `<p class="notice notice--success" role="status" tabindex="-1">${iconHtml('check')}${escapeHtml(text)}</p>`;

// snippets/contact-fields
function ContactFields({ idPrefix = 'ContactForm', showPhone, columns, messageLabel, rows = 6 }) {
  const nameEmail = (
    <>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-name`}>
          {t('contact.name')}
        </label>
        <input className="input" type="text" id={`${idPrefix}-name`} name="name" autoComplete="name" maxLength={100} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-email`}>
          {t('contact.email')} *
        </label>
        <input className="input" type="email" id={`${idPrefix}-email`} name="email" autoComplete="email" spellCheck="false" required />
      </div>
    </>
  );
  return (
    <>
      {columns ? <div className="main-contact__row">{nameEmail}</div> : nameEmail}
      {showPhone && (
        <div className="field">
          <label className="field__label" htmlFor={`${idPrefix}-phone`}>
            {t('contact.phone')}
          </label>
          <input
            className="input"
            type="tel"
            id={`${idPrefix}-phone`}
            name="phone"
            autoComplete="tel"
            pattern="\+?[0-9\s\(\)\-\.]{7,20}"
            data-message-invalid={t('forms.phone')}
          />
        </div>
      )}
      <div className="field">
        <label className="field__label" htmlFor={`${idPrefix}-body`}>
          {messageLabel || t('contact.message')} *
        </label>
        <textarea className="input" id={`${idPrefix}-body`} name="message" rows={rows} maxLength={5000} required />
      </div>
      <button type="submit" className="btn btn--full">
        {t('contact.send')}
      </button>
    </>
  );
}

export default function ContactForm({
  className,
  path = 'contact',
  action,
  messageError,
  success,
  heading,
  formId,
  formClass,
  intro,
  fields,
  ...fieldProps
}) {
  const settings = getSettings();
  const api = settings.api_url?.replace(/\/$/, '');
  if (!api) return null;
  return (
    <contact-form
      class={className}
      data-endpoint={`${api}/${path}`}
      data-action={action}
      data-recaptcha={settings.recaptcha_site_key || undefined}
      data-message-error={messageError || t('contact.error')}
      data-message-email={t('forms.email')}
      data-message-phone={fieldProps.showPhone ? t('forms.phone') : undefined}
    >
      {heading && <h2 className="h4">{heading}</h2>}
      <form-validate
        data-message-required={t('forms.required')}
        data-message-email={t('forms.email')}
        data-message-invalid={t('forms.invalid')}
      >
        <form id={formId} className={formClass}>
          {fields ?? (
            <>
              <p className="form-errors" role="alert" data-contact-message="" />
              {intro}
              <ContactFields {...fieldProps} />
            </>
          )}
        </form>
      </form-validate>
      <template data-contact-success="" dangerouslySetInnerHTML={{ __html: successHtml(success || t('contact.success')) }} />
    </contact-form>
  );
}
