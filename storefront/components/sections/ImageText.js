// theme/sections/image-text.liquid: an image on one side; eyebrow, heading, text and a button on the other
import SectionIntro from '../SectionIntro.js';
import ThemeImage from '../ThemeImage.js';
import { linkUrl } from '@/lib/links.js';

export default function ImageText({ section }) {
  const { settings } = section;
  return (
    <div className={`image-text image-text--image-${settings.image_position} color-${settings.color_scheme} section-spacing`}>
      <div className="image-text__inner page-width">
        <div className="frame image-text__media" style={{ '--frame-ratio': settings.ratio }}>
          <ThemeImage image={settings.image} widths={[600, 900, 1200, 1600]} sizes="(min-width: 750px) 50vw, 100vw" />
        </div>
        <div className="image-text__content">
          <SectionIntro
            eyebrow={settings.eyebrow}
            heading={settings.heading}
            headingClass="h2"
            text={settings.text}
            textClass="rte image-text__text"
            buttonLabel={settings.button_label}
            buttonLink={linkUrl(settings.button_link) || '/'}
          />
        </div>
      </div>
    </div>
  );
}
