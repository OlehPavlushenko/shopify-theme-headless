// theme/sections/announcement-bar.liquid: one message per block; several take turns (<ui-slider> autoplay)
import Link from 'next/link';
import Icon from '../Icon.js';
import { t } from '@/lib/theme.js';
import { linkUrl, scheduleActive } from '@/lib/links.js';

export default function AnnouncementBar({ section }) {
  const { settings, blocks } = section;
  if (!blocks.length || !scheduleActive(settings.show_from, settings.show_until)) return null;
  const several = blocks.length > 1;
  return (
    <div className={`announcement-bar color-${settings.color_scheme}`}>
      <ui-slider
        class="announcement-bar__inner page-width"
        data-autoplay={several ? settings.autoplay : undefined}
        aria-label={t('sections.announcements.label')}
      >
        {several && (
          <button type="button" className="announcement-bar__arrow" data-slider-prev="" aria-label={t('general.slider.previous')}>
            <Icon name="chevron-left" />
          </button>
        )}
        <ul className="scroll-track announcement-bar__track" data-slider-track="" role="list">
          {blocks.map((block) => (
            <li key={block.id} className="announcement-bar__item">
              {block.settings.link ? (
                <Link
                  href={linkUrl(block.settings.link)}
                  className="announcement-bar__link"
                  dangerouslySetInnerHTML={{ __html: block.settings.text }}
                />
              ) : (
                <p className="announcement-bar__text" dangerouslySetInnerHTML={{ __html: block.settings.text }} />
              )}
            </li>
          ))}
        </ul>
        {several && (
          <button type="button" className="announcement-bar__arrow" data-slider-next="" aria-label={t('general.slider.next')}>
            <Icon name="chevron-right" />
          </button>
        )}
      </ui-slider>
    </div>
  );
}
