/**
 * <ui-countdown> — timer to a fixed moment.
 *
 * Markup contract:
 *   <ui-countdown data-end="<unix seconds>"> … <span data-unit="days|hours|minutes|seconds">00</span> … </ui-countdown>
 * Ticks once a second only while it is on screen and the page is visible (each tick changes text,
 * which costs a layout); it catches up at once when it comes back. At zero it hides the closest
 * [data-countdown-section] (or itself) and dispatches countdown:end.
 */
const UNITS = { days: 86400, hours: 3600, minutes: 60, seconds: 1 };

class UiCountdown extends HTMLElement {
  #timer;
  #observer;
  #onScreen = false;
  #abort;

  connectedCallback() {
    this.end = Number(this.dataset.end) * 1000;
    this.values = [...this.querySelectorAll('[data-unit]')];
    if (!this.end) return;
    this.#tick();
    this.#observer = new IntersectionObserver(([entry]) => {
      this.#onScreen = entry.isIntersecting;
      this.#run();
    });
    this.#observer.observe(this);
    this.#abort = new AbortController();
    document.addEventListener('visibilitychange', this.#run, { signal: this.#abort.signal });
  }

  disconnectedCallback() {
    clearInterval(this.#timer);
    this.#observer?.disconnect();
    this.#abort?.abort();
  }

  #run = () => {
    clearInterval(this.#timer);
    this.#timer = undefined;
    if (!this.#onScreen || document.hidden || this.end <= Date.now()) return;
    this.#tick();
    this.#timer = setInterval(this.#tick, 1000);
  };

  #tick = () => {
    let left = Math.max(0, Math.floor((this.end - Date.now()) / 1000));
    for (const el of this.values) {
      const size = UNITS[el.dataset.unit] ?? 1;
      const value = Math.floor(left / size);
      left -= value * size;
      const text = el.dataset.unit === 'days' ? String(value) : String(value).padStart(2, '0');
      if (el.textContent !== text) el.textContent = text;
    }
    if (this.end <= Date.now()) {
      clearInterval(this.#timer);
      (this.closest('[data-countdown-section]') ?? this).hidden = true;
      this.dispatchEvent(new CustomEvent('countdown:end', { bubbles: true }));
    }
  };
}

if (!customElements.get('ui-countdown')) customElements.define('ui-countdown', UiCountdown);
