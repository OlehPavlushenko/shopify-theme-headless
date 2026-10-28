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
 * localStorage: the wheel spins once per browser and shows the same prize when it comes back.
 * The codes are ordinary codes from Shopify Discounts (no app): anyone could read them in the page.
 */
const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

class SpinWheel extends HTMLElement {
  connectedCallback() {
    this.prizes = JSON.parse(this.querySelector('[data-wheel-prizes]')?.textContent || '[]');
    this.disc = this.querySelector('[data-wheel-disc]');
    this.key = `spin-wheel:${this.dataset.key}`;
    if (!this.prizes.length || !this.disc) return;
    this.querySelector('[data-wheel-copy]')?.addEventListener('click', this.#copy);

    // Spun before: the disc stays on that prize and the result shows
    const saved = Number(read(this.key));
    if (read(this.key) !== null && this.prizes[saved]) {
      this.#turn(saved, 0);
      return this.#show(saved, false);
    }
    this.addEventListener('newsletter:subscribed', () => this.#spin());
    this.querySelector('[data-wheel-spin]')?.addEventListener('click', () => this.#spin());
  }

  // A prize by weight
  #pick() {
    const total = this.prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let roll = Math.random() * total;
    return Math.max(
      0,
      this.prizes.findIndex((prize) => (roll -= prize.weight) < 0)
    );
  }

  // Rotates the disc so the prize's segment stops under the pointer (at the top), after `spins` turns
  #turn(index, spins) {
    const segment = 360 / this.prizes.length;
    const jitter = spins ? (Math.random() - 0.5) * segment * 0.6 : 0;
    this.disc.style.setProperty('--turn', `${spins * 360 - (index + 0.5) * segment + jitter}deg`);
  }

  #spin() {
    if (this.hasAttribute('data-spinning') || this.hasAttribute('data-spun')) return;
    const index = this.#pick();
    try {
      localStorage.setItem(this.key, String(index));
    } catch {}
    this.setAttribute('data-spinning', '');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#turn(index, reduced ? 1 : 7);
    const done = () => {
      this.removeAttribute('data-spinning');
      this.#show(index, true);
    };
    if (reduced || getComputedStyle(this.disc).transitionDuration === '0s') return done();
    this.disc.addEventListener('transitionend', done, { once: true });
  }

  #show(index, apply) {
    const prize = this.prizes[index];
    this.setAttribute('data-spun', '');
    const result = this.querySelector('[data-wheel-result]');
    result.querySelector('[data-wheel-prize]').textContent = prize.label;
    result.querySelector('[data-wheel-code]').textContent = prize.code;
    result.hidden = false;
    const note = result.querySelector('[data-wheel-note]');
    const say = (state) => note && (note.textContent = note.dataset[state] ?? '');
    if (!apply || !prize.code) return say('saved');
    say('applying');
    const onResult = (event) => {
      if (event.detail.code.toLowerCase() !== prize.code.toLowerCase()) return;
      document.removeEventListener('discount:result', onResult);
      say(event.detail.applicable ? 'applied' : 'failed');
    };
    document.addEventListener('discount:result', onResult);
    result.focus?.();
    this.dispatchEvent(new CustomEvent('discount:apply', { bubbles: true, detail: { code: prize.code } }));
  }

  #copy = async (event) => {
    const button = event.currentTarget;
    const code = this.querySelector('[data-wheel-code]').textContent;
    try {
      await navigator.clipboard.writeText(code);
      button.textContent = button.dataset.copied;
    } catch {}
  };
}

if (!customElements.get('spin-wheel')) customElements.define('spin-wheel', SpinWheel);
