// theme/sections/brands.liquid: brand logos (or names) in a slider, optionally muted until hover
import Link from 'next/link';
import SectionHead from '../SectionHead.js';
import ThemeImage from '../ThemeImage.js';
import { linkUrl } from '@/lib/links.js';

export default function Brands({ section }) {
  const { settings, blocks } = section;
  return (
    <div className={`brands${settings.muted ? ' brands--muted' : ''} color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <ui-slider class="slider" style={{ '--slider-columns': settings.columns, '--slider-columns-mobile': 2.5 }}>
          <SectionHead heading={settings.heading} linkLabel={settings.link_label} link={linkUrl(settings.link)} nav />
          <ul className="scroll-track slider__track" data-slider-track="" role="list">
            {blocks.map((block) => {
              const { name, image, link } = block.settings;
              const content = image ? (
                <ThemeImage
                  image={image}
                  className="brand-card__logo"
                  widths={[200, 300, 400]}
                  sizes="(min-width: 990px) 16vw, 40vw"
                  alt={name}
                />
              ) : (
                <span className="brand-card__name">{name}</span>
              );
              return (
                <li key={block.id}>
                  {link ? (
                    <Link href={linkUrl(link)} className="card brand-card" aria-label={name}>
                      {content}
                    </Link>
                  ) : (
                    <div className="card brand-card">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </ui-slider>
      </div>
    </div>
  );
}
