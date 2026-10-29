// theme/sections/countdown-bar.liquid: heading, offer, timer and a link on one line, over an optional image
import Link from 'next/link';
import Countdown from '../Countdown.js';
import Icon from '../Icon.js';
import ThemeImage from '../ThemeImage.js';
import { linkUrl, scheduleActive } from '@/lib/links.js';

export default function CountdownBar({ section }) {
  const { settings } = section;
  if (!settings.end || !scheduleActive(settings.show_from, settings.end)) return null;
  return (
    <div className={`countdown-bar color-${settings.color_scheme}`} data-countdown-section>
      <ThemeImage
        image={settings.image}
        className="countdown-bar__image"
        widths={[750, 1200, 1600]}
        sizes="100vw"
        loading="eager"
        fetchPriority="low"
      />
      <div className="countdown-bar__inner page-width">
        {settings.heading && <span className="countdown-bar__heading">{settings.heading}</span>}
        {settings.offer && <span className="countdown-bar__offer">{settings.offer}</span>}
        <Countdown end={settings.end} />
        {settings.button_label && (
          <Link href={linkUrl(settings.button_link) || '/collections/all'} className="btn btn--link countdown-bar__link">
            {settings.button_label}
            <Icon name="arrow-right" />
          </Link>
        )}
      </div>
    </div>
  );
}
