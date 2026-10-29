// theme/sections/hero.liquid: slides (blocks) with an image (+ phone image) or a background video, caption
// card / split / overlay, tint, buttons; two or more slides make a <ui-slider> (autoplay, loop, dots).
// The first slide of the first section loads eagerly (LCP). Headings are h2 styled as h1.
import Link from 'next/link';
import BackgroundVideo from '../BackgroundVideo.js';
import SliderNav from '../SliderNav.js';
import { imageUrl, t } from '@/lib/theme.js';
import { linkUrl } from '@/lib/links.js';

const srcset = (src, widths) => widths.map((width) => `${src}?width=${width} ${width}w`).join(', ');

async function SlideMedia({ settings, eager }) {
  const [desktop, mobile] = await Promise.all([imageUrl(settings.image), imageUrl(settings.image_mobile || settings.image)]);
  return (
    <div className="frame frame--cover hero__media">
      {desktop && (
        <picture>
          <source media="(min-width: 750px)" srcSet={srcset(desktop, [1500, 2200, 3000])} sizes="100vw" />
          <img
            src={`${mobile}?width=1200`}
            srcSet={srcset(mobile, [600, 900, 1200])}
            sizes="100vw"
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            fetchPriority={eager && !settings.video ? 'high' : undefined}
          />
        </picture>
      )}
      {settings.video && (
        <background-video
          class="hero__video"
          data-start={settings.video_start > 0 ? settings.video_start : undefined}
          data-end={settings.video_end > settings.video_start ? settings.video_end : undefined}
        >
          <BackgroundVideo video={settings.video} maxHeight={1080} className="hero__video-file" />
          <BackgroundVideo
            video={settings.video_mobile || settings.video}
            maxHeight={720}
            posterWidth={800}
            className="hero__video-file hero__video-file--mobile"
          />
        </background-video>
      )}
    </div>
  );
}

export default function Hero({ section, index }) {
  const { settings, blocks } = section;
  const several = blocks.length > 1;
  return (
    <ui-slider
      class={`hero hero--${settings.height}`}
      data-autoplay={several && settings.autoplay > 0 ? settings.autoplay : undefined}
      data-loop={several && settings.loop ? '' : undefined}
      aria-roledescription="carousel"
      aria-label={t('sections.hero.label')}
    >
      <ul className="scroll-track hero__track" data-slider-track role="list">
        {blocks.map((block, slide) => {
          const s = block.settings;
          const caption = s.eyebrow || s.heading || s.text || s.button_label || s.button_label_2 ? s.caption : 'none';
          const media = s.image || s.video ? ' hero__slide--media' : '';
          return (
            <li
              key={block.id}
              className={`hero__slide hero__slide--${s.position} hero__slide--${caption}${media} color-${s.color_scheme}`}
              style={{ '--hero-overlay': `${s.overlay}%`, '--hero-tint': s.tint_color || '#000000' }}
              aria-roledescription={several ? 'slide' : undefined}
              aria-label={several ? `${slide + 1} / ${blocks.length}` : undefined}
            >
              <SlideMedia settings={s} eager={index === 0 && slide === 0} />
              {caption !== 'none' && (
                <div className="hero__inner page-width">
                  <div className="hero__content">
                    {s.eyebrow && <p className="eyebrow hero__eyebrow">{s.eyebrow}</p>}
                    {s.heading && <h2 className="h1 hero__heading" dangerouslySetInnerHTML={{ __html: s.heading }} />}
                    {s.text && <div className="text-lead hero__text" dangerouslySetInnerHTML={{ __html: s.text }} />}
                    {(s.button_label || s.button_label_2) && (
                      <div className="hero__buttons">
                        {s.button_label && (
                          <Link href={linkUrl(s.button_link) || '/collections/all'} className="btn btn--lg">
                            {s.button_label}
                          </Link>
                        )}
                        {s.button_label_2 && (
                          <Link href={linkUrl(s.button_link_2) || '/collections'} className="btn btn--outline btn--lg">
                            {s.button_label_2}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {several && (
        <div className={`hero__controls page-width color-${blocks[0].settings.color_scheme}`} style={{ background: 'none' }}>
          <div className="slider__dots hero__dots" data-slider-dots data-label={t('sections.hero.slide')} />
          <SliderNav label={t('sections.hero.label')} />
        </div>
      )}
    </ui-slider>
  );
}
