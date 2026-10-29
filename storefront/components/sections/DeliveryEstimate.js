// theme/sections/delivery-estimate.liquid: order placed → ships → delivered with today's dates and a
// countdown to the cut-off hour (<delivery-steps>, @ui/delivery-steps); the business-day ranges until it runs
import Icon from '../Icon.js';
import SectionIntro from '../SectionIntro.js';
import { t } from '@/lib/theme.js';

function Step({ icon, label, date, children, done }) {
  return (
    <li className={`delivery-estimate__step${done ? ' delivery-estimate__step--done' : ''}`}>
      <span className="icon-circle delivery-estimate__icon" aria-hidden="true">
        <Icon name={icon} />
      </span>
      <span className="delivery-estimate__label">{label}</span>
      <span className="delivery-estimate__date" data-delivery-date={date}>
        {children}
      </span>
    </li>
  );
}

export default function DeliveryEstimate({ section }) {
  const { settings } = section;
  const min = settings.min_days;
  const max = Math.max(settings.max_days, min);
  return (
    <div className={`delivery-estimate color-${settings.color_scheme} section-spacing`}>
      <div className="page-width">
        <delivery-steps
          class="card delivery-estimate__card"
          data-min={min}
          data-max={max}
          data-cutoff={settings.cutoff}
          data-locale="en"
          data-today={t('delivery.today')}
          data-lead-today={t('delivery.lead_today', { time: '%time' })}
          data-lead-later={t('delivery.lead_later', { date: '%date' })}
          data-time-long={t('delivery.time_long')}
          data-time-short={t('delivery.time_short')}
        >
          <div className="delivery-estimate__head">
            <SectionIntro eyebrow={settings.eyebrow} heading={settings.heading} />
            <p className="delivery-estimate__lead">
              <Icon name="clock" />
              <span data-delivery-lead="">{t('delivery.lead_fallback', { hour: settings.cutoff })}</span>
            </p>
          </div>
          <ol className="delivery-estimate__steps" role="list">
            <Step icon="cart" label={settings.order_label} date="order" done>
              {t('delivery.today')}
            </Step>
            <Step icon="truck" label={settings.ship_label} date="ship">
              {t('delivery.ship_fallback')}
            </Step>
            <Step icon="gift" label={settings.arrive_label} date="arrive">
              {t('delivery.arrive_fallback', { range: `${min}–${max}` })}
            </Step>
          </ol>
          <SectionIntro text={settings.text} textClass="rte delivery-estimate__note" />
        </delivery-steps>
      </div>
    </div>
  );
}
