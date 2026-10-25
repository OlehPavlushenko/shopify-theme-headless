/* Generated from packages/ui/js/countdown.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <ui-countdown> — timer to a fixed moment.
 *
 * Markup contract:
 *   <ui-countdown data-end="<unix seconds>"> … <span data-unit="days|hours|minutes|seconds">00</span> … </ui-countdown>
 * Updates once a second (only while the page is visible: the interval is rebuilt on return).
 * At zero it hides the closest [data-countdown-section] (or itself) and dispatches countdown:end.
 */
const UNITS = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

class UiCountdown extends HTMLElement {
  #timer;

  connectedCallback() {
    this.end = Number(this.dataset.end) * 1000;
    this.values = [...this.querySelectorAll('[data-unit]')];
    if (!this.end) return;
    this.#tick();
    this.#timer = setInterval(this.#tick, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
  }

  #tick = () => {
    let left = Math.max(0, Math.floor((this.end - Date.now()) / 1000));
    for (const el of this.values) {
      const size = UNITS[el.dataset.unit] ?? 1;
      const value = Math.floor(left / size);
      left -= value * size;
      el.textContent = el.dataset.unit === 'days' ? String(value) : String(value).padStart(2, '0');
    }
    if (this.end <= Date.now()) {
      clearInterval(this.#timer);
      (this.closest('[data-countdown-section]') ?? this).hidden = true;
      this.dispatchEvent(new CustomEvent('countdown:end', { bubbles: true }));
    }
  };
}

if (!customElements.get('ui-countdown')) customElements.define('ui-countdown', UiCountdown);
