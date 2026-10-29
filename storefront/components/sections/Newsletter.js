// theme/sections/newsletter.liquid: heading, text and the sign-up form; inline or banner (with an image)
import NewsletterForm from '../NewsletterForm.js';
import ThemeImage from '../ThemeImage.js';

export default function Newsletter({ section }) {
  const { id, settings } = section;
  const banner = settings.layout === 'banner';
  return (
    <div className={`newsletter newsletter--${settings.layout} color-${settings.color_scheme}`}>
      <div className="newsletter__inner page-width">
        {banner && settings.image && (
          <div className="newsletter__media">
            <ThemeImage image={settings.image} widths={[320, 480, 640, 800]} sizes="(min-width: 750px) 320px, 100vw" />
          </div>
        )}
        <div className="newsletter__content">
          <div className="newsletter__text">
            {settings.heading && <h2 className={banner ? 'h3' : 'h4'} dangerouslySetInnerHTML={{ __html: settings.heading }} />}
            {settings.text && <div className="newsletter__body" dangerouslySetInnerHTML={{ __html: settings.text }} />}
          </div>
          <NewsletterForm
            id={id}
            buttonLabel={settings.button_label}
            successText={settings.success_text}
            discountCode={settings.discount_code}
          />
        </div>
      </div>
    </div>
  );
}
