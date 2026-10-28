/**
 * <spin-wheel> — "Spin to win": a prize wheel that spins once and gives a discount code.
 *
 * Markup contract (theme: the wheel block of sections/promo-popup.liquid):
 *   <spin-wheel data-key="<storage key>">
 *     [data-wheel-disc] the disc (CSS rotates it by --turn), labels inside
 *     <script type="application/json" data-wheel-prizes>[{ "label", "code", "weight" }]</script>
 *     a <newsletter-form> (the spin starts on newsletter:subscribed) or [data-wheel-spin] (a button)
 *     [data-wheel-result hidden] > [data-wheel-prize] [data-wheel-code] [data-wheel-copy data-copied="…"]
 *       [data-wheel-note data-applying data-applied data-failed data-saved] (texts for each state)
 *   </spin-wheel>
 * The prize is picked here by weight, the disc stops on it, the result shows the code and
 * discount:apply ({ detail: { code } }, bubbles) asks the cart to apply it; the note follows the
 * cart's discount:result (applied, or not taken — e.g. no such code in Discounts). The prize is kept in
 * localStorage (@ui/storage): the wheel spins once per browser and shows the same prize when it comes
 * back. Copy puts the code on the clipboard and says so on the button for a moment.
 * The codes are ordinary codes from Shopify Discounts (no app): anyone could read them in the page.
 */
import { copyText, flashLabel } from '@ui/clipboard';
import { reducedMotion } from '@ui/scroll';
import * as storage from '@ui/storage';

class SpinWheel extends HTMLElement {
  #abort;
  #noteTimer;
  #prizes = [];
  #disc;
  #key;

  connectedCallback() {
    this.#prizes = JSON.parse(this.querySelector('[data-wheel-prizes]')?.textContent || '[]');
    this.#disc = this.querySelector('[data-wheel-disc]');
    this.#key = `spin-wheel:${this.dataset.key}`;
    if (!this.#prizes.length || !this.#disc) return;
    const { signal } = (this.#abort = new AbortController());
    this.querySelector('[data-wheel-copy]')?.addEventListener('click', this.#onCopy, { signal });

    // Spun before: the disc stays on that prize and the result shows
    const saved = storage.get(this.#key);
    if (saved !== null && this.#prizes[Number(saved)]) {
      this.#turn(Number(saved), 0);
      return this.#show(Number(saved), false);
    }
    this.addEventListener('newsletter:subscribed', this.#onSpin, { signal });
    this.querySelector('[data-wheel-spin]')?.addEventListener('click', this.#onSpin, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    clearTimeout(this.#noteTimer);
  }

  // A prize by weight
  #pick() {
    const total = this.#prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let roll = Math.random() * total;
    return Math.max(
      0,
      this.#prizes.findIndex((prize) => (roll -= prize.weight) < 0)
    );
  }

  // Rotates the disc so the prize's segment stops under the pointer (at the top), after `spins` turns
  #turn(index, spins) {
    const segment = 360 / this.#prizes.length;
    const jitter = spins ? (Math.random() - 0.5) * segment * 0.6 : 0;
    this.#disc.style.setProperty('--turn', `${spins * 360 - (index + 0.5) * segment + jitter}deg`);
  }

  #onSpin = () => {
    if (this.hasAttribute('data-spinning') || this.hasAttribute('data-spun')) return;
    const index = this.#pick();
    storage.set(this.#key, index);
    this.setAttribute('data-spinning', '');
    const reduced = reducedMotion();
    this.#turn(index, reduced ? 1 : 7);
    const done = () => {
      this.removeAttribute('data-spinning');
      this.#show(index, true);
    };
    if (reduced || getComputedStyle(this.#disc).transitionDuration === '0s') return done();
    this.#disc.addEventListener('transitionend', done, { once: true, signal: this.#abort.signal });
  };

  #show(index, apply) {
    const prize = this.#prizes[index];
    this.setAttribute('data-spun', '');
    const result = this.querySelector('[data-wheel-result]');
    result.querySelector('[data-wheel-prize]').textContent = prize.label;
    result.querySelector('[data-wheel-code]').textContent = prize.code;
    result.hidden = false;
    const note = result.querySelector('[data-wheel-note]');
    const say = (state) => note && (note.textContent = note.dataset[state] ?? '');
    if (!apply || !prize.code) return say('saved');
    say('applying');
    // The cart's answer for this code (or none within 8 s: the code stays to copy)
    const done = (state) => {
      clearTimeout(this.#noteTimer);
      document.removeEventListener('discount:result', onResult);
      say(state);
    };
    const onResult = (event) => {
      if (event.detail.code.toLowerCase() === prize.code.toLowerCase()) done(event.detail.applicable ? 'applied' : 'failed');
    };
    this.#noteTimer = setTimeout(() => done('saved'), 8000);
    document.addEventListener('discount:result', onResult, { signal: this.#abort.signal });
    result.focus?.();
    this.dispatchEvent(new CustomEvent('discount:apply', { bubbles: true, detail: { code: prize.code } }));
  }

  #onCopy = async (event) => {
    const button = event.currentTarget;
    if (await copyText(this.querySelector('[data-wheel-code]').textContent)) flashLabel(button, button.dataset.copied);
  };
}

if (!customElements.get('spin-wheel')) customElements.define('spin-wheel', SpinWheel);
