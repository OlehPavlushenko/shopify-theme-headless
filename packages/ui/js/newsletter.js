/**
 * <newsletter-form> — newsletter sign-up without a page reload.
 *
 * Markup contract (theme: snippets/newsletter-form.liquid):
 *   <newsletter-form data-endpoint="https://api…/newsletter" [data-recaptcha="<v3 site key>"]
 *                    data-message-invalid="…" data-message-error="…">
 *     <form> input[type=email] [data-newsletter-fields] [data-newsletter-message] </form>
 *     <template data-newsletter-success>…</template> <template data-newsletter-already>…</template>
 *   </newsletter-form>
 * Without data-endpoint (or without JS) the form submits normally.
 * The endpoint answers { ok, status: subscribed | already_subscribed } or { ok: false, error }.
 * On success the fields are replaced by the success text and newsletter:subscribed is dispatched
 * (detail: { status, discount } — discount from data-discount, for the cart to apply).
 * Sending and reCAPTCHA (action "newsletter"): @ui/api.
 */
import { postJSON } from '@ui/api';
import * as storage from '@ui/storage';

class NewsletterForm extends HTMLElement {
  #abort;
  #form;
  #input;
  #message;

  connectedCallback() {
    this.#form = this.querySelector('form');
    if (!this.#form || !this.dataset.endpoint) return;
    this.#input = this.#form.querySelector('input[type="email"]');
    this.#message = this.querySelector('[data-newsletter-message]');
    const { signal } = (this.#abort = new AbortController());
    this.#form.addEventListener('submit', this.#onSubmit, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onSubmit = async (event) => {
    event.preventDefault();
    const email = this.#input.value.trim();
    if (!this.#input.checkValidity() || !email) return this.#error(this.dataset.messageInvalid);

    const button = this.#form.querySelector('[type="submit"]');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    this.#error('');
    try {
      const result = await postJSON(this.dataset.endpoint, { email }, { recaptcha: this.dataset.recaptcha, action: 'newsletter' });
      if (result.ok) return this.#done(result.status);
      this.#error(result.error === 'invalid_email' ? this.dataset.messageInvalid : this.dataset.messageError);
    } catch {
      this.#error(this.dataset.messageError);
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  };

  #error(text) {
    this.#message.textContent = text;
    this.#input.toggleAttribute('aria-invalid', Boolean(text));
  }

  #done(status) {
    const template = this.querySelector(status === 'already_subscribed' ? '[data-newsletter-already]' : '[data-newsletter-success]');
    const done = document.createElement('div');
    done.className = 'newsletter-form__done';
    done.setAttribute('role', 'status');
    done.append(template.content.cloneNode(true));
    this.#form.replaceChildren(done);
    // Remembered on this device: popups asking to sign up don't show again (@ui/promo-popup)
    storage.set('newsletter:subscribed', '1');
    this.dispatchEvent(new CustomEvent('newsletter:subscribed', { bubbles: true, detail: { status, discount: this.dataset.discount } }));
  }
}

if (!customElements.get('newsletter-form')) customElements.define('newsletter-form', NewsletterForm);
