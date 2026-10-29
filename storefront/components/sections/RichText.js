// theme/sections/rich-text.liquid: a heading and text, optionally its first lines with "Read more"
// (<read-more>; the whole text stays in the HTML). The collection source comes with the collection page.
import { t } from '@/lib/theme.js';

export default function RichText({ section }) {
  const { settings } = section;
  if (!settings.text || settings.source === 'collection') return null;
  const text = (
    <div
      className="rte rich-text__text"
      data-read-more-content={settings.collapse ? '' : undefined}
      dangerouslySetInnerHTML={{ __html: settings.text }}
    />
  );
  return (
    <div
      className={`rich-text rich-text--${settings.alignment} rich-text--${settings.text_size} color-${settings.color_scheme} section-spacing`}
    >
      <div className="page-width page-width--narrow rich-text__inner">
        {settings.heading && (
          <h2
            className={`${settings.text_size === 'small' ? 'h4' : 'h2'} rich-text__heading`}
            dangerouslySetInnerHTML={{ __html: settings.heading }}
          />
        )}
        {settings.collapse ? (
          <read-more class="read-more" style={{ '--read-more-lines': settings.lines }}>
            {text}
            <button
              type="button"
              className="btn btn--link read-more__toggle"
              data-read-more-toggle
              data-label-more={t('general.read_more')}
              data-label-less={t('general.read_less')}
              aria-expanded="false"
              hidden
            >
              {t('general.read_more')}
            </button>
          </read-more>
        ) : (
          text
        )}
      </div>
    </div>
  );
}
