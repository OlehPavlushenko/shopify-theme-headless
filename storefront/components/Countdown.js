// Inline timer "Ends in 6d 19h 05m 01s": theme/snippets/countdown.liquid (<ui-countdown>, @ui/countdown)
import { t } from '@/lib/theme.js';
import { toTime } from '@/lib/links.js';

export default function Countdown({ end, label = true, labelText }) {
  return (
    <span className="countdown-line">
      {label && <span className="countdown-line__label">{labelText || t('sections.countdown.ends_in')}</span>}
      <ui-countdown class="countdown" data-end={Math.floor(toTime(end) / 1000)} role="timer" aria-label={t('sections.countdown.label')}>
        {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
          <span key={unit} className="countdown__part">
            <span className="countdown__value" data-unit={unit}>
              {unit === 'days' ? '0' : '00'}
            </span>
            {t(`sections.countdown.${unit}`)}
          </span>
        ))}
      </ui-countdown>
    </span>
  );
}
