/**
 * <contact-form> — sends a form to an API without a page reload: the contact form, and the
 * back-in-stock request on the product page (data-action="notify": the reCAPTCHA action).
 *
 * Markup contract (theme: snippets/contact-form.liquid):
 *   <contact-form data-endpoint="https://api…/contact" [data-recaptcha="<v3 site key>"]
 *                 [data-action="contact"] data-message-error="…" data-message-email="…" data-message-phone="…">
 *     <form-validate> <form> named fields (sent as JSON, e.g. name, email, phone, message)
 *       [data-contact-message] (errors) </form> </form-validate>
 *     <template data-contact-success>…</template>
 *   </contact-form>
 * Listens on itself, so the fields are checked first (<form-validate> stops an invalid form before
 * the event gets here). Without data-endpoint (or without JS) the form submits normally.
 * The endpoint answers { ok: true } or { ok: false, error: invalid_email | invalid_phone | … }.
 * On success the form is replaced by the success text. Sending and reCAPTCHA: @ui/api.
 */
import { postJSON, wakeWhenSeen } from '@ui/api';

class ContactForm extends HTMLElement {
  #abort;
  #form;
  #message;

  connectedCallback() {
    this.#form = this.querySelector('form');
    if (!this.#form || !this.dataset.endpoint) return;
    this.#message = this.querySelector('[data-contact-message]');
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('submit', this.#onSubmit, { signal });
    wakeWhenSeen(this, this.dataset.endpoint, signal);
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #onSubmit = async (event) => {
    event.preventDefault();
    const button = this.#form.querySelector('[type="submit"]');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    this.#error('');
    try {
      const data = Object.fromEntries(new FormData(this.#form));
      const result = await postJSON(this.dataset.endpoint, data, {
        recaptcha: this.dataset.recaptcha,
        action: this.dataset.action ?? 'contact',
      });
      if (result.ok) return this.#done();
      const messages = { invalid_email: this.dataset.messageEmail, invalid_phone: this.dataset.messagePhone };
      this.#error(messages[result.error] ?? this.dataset.messageError);
    } catch {
      this.#error(this.dataset.messageError);
    } finally {
      button.removeAttribute('aria-busy');
      button.disabled = false;
    }
  };

  #error(text) {
    this.#message.textContent = text;
  }

  #done() {
    const done = this.querySelector('[data-contact-success]').content.cloneNode(true);
    this.#form.replaceChildren(done);
    this.#form.querySelector('[tabindex="-1"]')?.focus();
  }
}

if (!customElements.get('contact-form')) customElements.define('contact-form', ContactForm);
