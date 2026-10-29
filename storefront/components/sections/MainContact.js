// theme/sections/main-contact.liquid: the store's contacts (Theme settings > Store details) with social
// links and the page text, beside the contact form (sent to project-server: needs the API URL)
import ContactForm from '../ContactForm.js';
import Icon from '../Icon.js';
import { SocialLinks } from '../StoreContacts.js';
import { getSettings, t } from '@/lib/theme.js';

function Item({ icon, label, children }) {
  return (
    <li className="main-contact__item">
      <span className="icon-circle main-contact__icon">
        <Icon name={icon} />
      </span>
      <span>
        <span className="main-contact__label">{label}</span>
        {children}
      </span>
    </li>
  );
}

export default function MainContact({ section, context = {} }) {
  const { settings } = section;
  const s = getSettings();
  const body = context.page?.body;
  return (
    <div className={`main-contact color-${settings.color_scheme} section-spacing`}>
      <div className="page-width main-contact__inner">
        <div className="main-contact__info">
          {body && <div className="rte main-contact__text" dangerouslySetInnerHTML={{ __html: body }} />}
          <ul className="main-contact__list" role="list">
            {s.store_phone && (
              <Item icon="phone" label={t('contact.phone')}>
                <a href={`tel:${s.store_phone.replace(/[\s()-]/g, '')}`}>{s.store_phone}</a>
              </Item>
            )}
            {s.store_email && (
              <Item icon="mail" label={t('contact.email')}>
                <a href={`mailto:${s.store_email}`}>{s.store_email}</a>
              </Item>
            )}
            {s.store_address && (
              <Item icon="map-pin" label={t('contact.address')}>
                <span>
                  {s.store_address.split('\n').map((line, index) => (
                    <span key={index}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </span>
              </Item>
            )}
            {s.store_hours && (
              <Item icon="clock" label={t('contact.hours')}>
                <span>{s.store_hours}</span>
              </Item>
            )}
          </ul>
          <SocialLinks />
        </div>
        <ContactForm
          className="card main-contact__form-card"
          heading={settings.form_heading}
          formId="ContactForm"
          formClass="main-contact__form"
          showPhone={settings.show_phone}
          columns
        />
      </div>
    </div>
  );
}
