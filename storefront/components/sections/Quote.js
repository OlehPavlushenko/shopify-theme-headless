// theme/sections/quote.liquid: one large quotation with the author, their role and a round photo
import { Fragment } from 'react';
import ThemeImage from '../ThemeImage.js';

export default function Quote({ section }) {
  const { settings } = section;
  if (!settings.quote) return null;
  const lines = settings.quote.split('\n');
  return (
    <div className={`quote color-${settings.color_scheme} section-spacing`}>
      <figure className="page-width page-width--narrow quote__inner">
        <blockquote className="quote__text">
          <p>
            {lines.map((line, index) => (
              <Fragment key={index}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        </blockquote>
        {settings.author && (
          <figcaption className="quote__author">
            <ThemeImage image={settings.image} widths={[112]} className="quote__photo" width={56} height={56} />
            <span>
              <span className="quote__name">{settings.author}</span>
              {settings.role && <span className="quote__role">{settings.role}</span>}
            </span>
          </figcaption>
        )}
      </figure>
    </div>
  );
}
