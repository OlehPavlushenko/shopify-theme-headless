/* Generated from packages/ui/js/delivery-steps.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <delivery-steps> — the delivery estimate as three steps (ordered → ships → delivered) with live
 * dates, and a lead line counting down to today's cut-off ("Order within 2 h 23 min — it ships
 * today"), refreshed every minute. Dates come from @ui/delivery.
 *
 * Markup contract:
 *   <delivery-steps data-min="2" data-max="4" data-cutoff="14" data-locale="en"
 *     data-today="Today" data-lead-today="Order within %time — it ships today" data-lead-later="Order now — it ships %date"
 *     data-time-long="%h h %m min" data-time-short="%m min">
 *     <span data-delivery-lead>server fallback</span>
 *     <span data-delivery-date="order|ship|arrive">server fallback</span>
 *   </delivery-steps>
 * Without JS the server text stays (business days, no dates).
 */
import { deliveryDates, formatLeft } from '@ui/delivery';

class DeliverySteps extends HTMLElement {
  #timer;

  connectedCallback() {
    this.#render();
    this.#timer = setInterval(() => this.#render(), 60000);
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
  }

  #render() {
    const { min, max, cutoff, locale, today, leadToday, leadLater, timeLong, timeShort } = this.dataset;
    const { shipsToday, ship, from, to, minutesLeft } = deliveryDates({ min, max, cutoff });
    const day = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short' });
    const set = (name, text) => {
      const node = this.querySelector(`[data-delivery-date="${name}"]`);
      if (node) node.textContent = text;
    };
    set('order', today);
    set('ship', shipsToday ? today : day.format(ship));
    set('arrive', `${day.format(from)} – ${day.format(to)}`);
    const lead = this.querySelector('[data-delivery-lead]');
    if (lead)
      lead.textContent = shipsToday
        ? leadToday.replace('%time', formatLeft(minutesLeft, timeLong, timeShort))
        : leadLater.replace('%date', day.format(ship));
    this.toggleAttribute('data-ships-today', shipsToday);
  }
}

if (!customElements.get('delivery-steps')) customElements.define('delivery-steps', DeliverySteps);
