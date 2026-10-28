/* Generated from packages/ui/js/spin-wheel.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <spin-wheel> — "Spin to win": a prize wheel that gives a discount code, once.
 *
 * Markup contract (theme: the wheel block of sections/promo-popup.liquid):
 *   <spin-wheel data-key="<storage key>"
 *               [data-endpoint="https://api…/spin" data-signature="<HMAC of the prize list>"
 *                data-recaptcha="<v3 site key>" data-message-email="…" data-message-error="…"]>
 *     [data-wheel-disc] the disc (CSS rotates it by --turn), labels inside
 *     <script type="application/json" data-wheel-prizes>[{ "label", "code", "weight" }]</script>
 *     with an endpoint: form[data-wheel-form] (an email field, [data-wheel-message]);
 *     without: [data-wheel-spin] (a button)
 *     [data-wheel-result hidden] > [data-wheel-prize] [data-wheel-code] [data-wheel-copy data-copied="…"]
 *       [data-wheel-note data-applying data-applied data-failed data-saved data-already]
 *   </spin-wheel>
 *
 * With an endpoint the server decides (project-server POST /spin): it gets the email and the prize
 * list exactly as printed with its signature (so the chances can't be changed here), signs the
 * email up, picks the prize and keeps it on the customer — the same email always gets the same
 * prize back ("already_spun": shown at once, without a spin). Without one the prize is picked here
 * (a demo; anyone could pick again in another browser).
 * Either way the disc stops on the prize, the result shows the code, discount:apply asks the cart
 * to apply it (the note follows the cart's discount:result), and the prize is kept in storage: the
 * popup doesn't come back on this device (@ui/promo-popup reads the same key). A sign-up also sets
 * "newsletter:subscribed" in storage and dispatches newsletter:subscribed (bubbles).
 */
import { postJSON, wakeWhenSeen } from '@ui/api';
import { copyText, flashLabel } from '@ui/clipboard';
import { reducedMotion } from '@ui/scroll';
import * as storage from '@ui/storage';

class SpinWheel extends HTMLElement {
  #abort;
  #noteTimer;
  #raw = '[]';
  #prizes = [];
  #disc;
  #key;

  connectedCallback() {
    this.#raw = this.querySelector('[data-wheel-prizes]')?.textContent.trim() || '[]';
    this.#prizes = JSON.parse(this.#raw);
    this.#disc = this.querySelector('[data-wheel-disc]');
    this.#key = `spin-wheel:${this.dataset.key}`;
    if (!this.#prizes.length || !this.#disc) return;
    const { signal } = (this.#abort = new AbortController());
    this.querySelector('[data-wheel-copy]')?.addEventListener('click', this.#onCopy, { signal });

    // Spun before on this device: the disc stays on that prize and the result shows
    const saved = storage.getJSON(this.#key);
    if (saved?.code) {
      this.#turn(this.#indexOf(saved), 0);
      return this.#show(saved, 'saved');
    }
    this.querySelector('[data-wheel-form]')?.addEventListener('submit', this.#onSubmit, { signal });
    if (this.dataset.endpoint) wakeWhenSeen(this, this.dataset.endpoint, signal);
    this.querySelector('[data-wheel-spin]')?.addEventListener('click', this.#onSpinHere, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    clearTimeout(this.#noteTimer);
  }

  #indexOf(prize) {
    return Math.max(
      0,
      this.#prizes.findIndex((p) => p.code === prize.code && p.label === prize.label)
    );
  }

  // Rotates the disc so the prize's segment stops under the pointer (at the top), after `spins` turns
  #turn(index, spins) {
    const segment = 360 / this.#prizes.length;
    const jitter = spins ? (Math.random() - 0.5) * segment * 0.6 : 0;
    this.#disc.style.setProperty('--turn', `${spins * 360 - (index + 0.5) * segment + jitter}deg`);
  }

  // Spins to the prize, then shows it and applies its code
  #spinTo(prize) {
    storage.setJSON(this.#key, prize);
    this.setAttribute('data-spinning', '');
    const reduced = reducedMotion();
    this.#turn(this.#indexOf(prize), reduced ? 1 : 7);
    const done = () => {
      this.removeAttribute('data-spinning');
      this.#show(prize, 'apply');
    };
    if (reduced || getComputedStyle(this.#disc).transitionDuration === '0s') return done();
    this.#disc.addEventListener('transitionend', done, { once: true, signal: this.#abort.signal });
  }

  // Without an endpoint: a prize by weight, picked here
  #onSpinHere = () => {
    if (this.hasAttribute('data-spinning') || this.hasAttribute('data-spun')) return;
    const total = this.#prizes.reduce((sum, prize) => sum + prize.weight, 0);
    let roll = Math.random() * total;
    this.#spinTo(this.#prizes.find((prize) => (roll -= prize.weight) < 0) ?? this.#prizes[0]);
  };

  // With an endpoint: the server signs the email up and picks (or returns the email's prize)
  #onSubmit = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.querySelector('input[type="email"]');
    const button = form.querySelector('[type="submit"]');
    if (button.hasAttribute('aria-busy') || this.hasAttribute('data-spun')) return;
    const email = input.value.trim();
    if (!email || !input.checkValidity()) return this.#error(this.dataset.messageEmail);
    this.#error('');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    try {
      const result = await postJSON(
        this.dataset.endpoint,
        { email, prizes: this.#raw, signature: this.dataset.signature },
        { recaptcha: this.dataset.recaptcha, action: 'spin' }
      );
      if (!result.ok || !result.prize) {
        return this.#error(result.error === 'invalid_email' ? this.dataset.messageEmail : this.dataset.messageError);
      }
      storage.set('newsletter:subscribed', '1');
      this.dispatchEvent(new CustomEvent('newsletter:subscribed', { bubbles: true, detail: { status: result.subscribed } }));
      if (result.status === 'already_spun') {
        storage.setJSON(this.#key, result.prize);
        this.#turn(this.#indexOf(result.prize), 0);
        return this.#show(result.prize, 'already');
      }
      this.#spinTo(result.prize);
    } catch {
      this.#error(this.dataset.messageError);
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  };

  #error(text) {
    const message = this.querySelector('[data-wheel-message]');
    if (message) message.textContent = text ?? '';
  }

  // mode: 'apply' (just won: apply the code), 'already' (this email spun before), 'saved' (this device)
  #show(prize, mode) {
    this.setAttribute('data-spun', '');
    const result = this.querySelector('[data-wheel-result]');
    result.querySelector('[data-wheel-prize]').textContent = prize.label;
    result.querySelector('[data-wheel-code]').textContent = prize.code;
    result.hidden = false;
    const note = result.querySelector('[data-wheel-note]');
    const say = (state) => note && (note.textContent = note.dataset[state] ?? '');
    if (mode !== 'apply' || !prize.code) return say(mode === 'already' ? 'already' : 'saved');
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
