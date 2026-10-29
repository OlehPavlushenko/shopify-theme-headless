// theme/sections/rich-text.liquid: a heading and text, optionally its first lines with "Read more"
// (<read-more>; the whole text stays in the HTML). Source "collection": the collection's metafields
// theme.seo_text (rich text) and theme.seo_heading — nothing when the collection has no text.
import { t } from '@/lib/theme.js';

export default function RichText({ section, context = {} }) {
  const { settings } = section;
  const collection = settings.source === 'collection' ? context.listing?.collection : null;
  const body = settings.source === 'collection' ? collection?.seoTextHtml : settings.text;
  const heading = collection?.seoHeading || settings.heading;
  if (!body) return null;
  const text = (
    <div
      className="rte rich-text__text"
      data-read-more-content={settings.collapse ? '' : undefined}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
  return (
    <div
      className={`rich-text rich-text--${settings.alignment} rich-text--${settings.text_size} color-${settings.color_scheme} section-spacing`}
    >
      <div className="page-width page-width--narrow rich-text__inner">
        {heading && (
          <h2
            className={`${settings.text_size === 'small' ? 'h4' : 'h2'} rich-text__heading`}
            dangerouslySetInnerHTML={{ __html: heading }}
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
