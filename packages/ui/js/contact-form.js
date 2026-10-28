/**
 * <contact-form> — sends a form to an API without a page reload: the contact form, and the
 * back-in-stock request on the product page (data-action="notify": the reCAPTCHA action).
 *
 * Markup contract (theme: sections/main-contact.liquid):
 *   <contact-form data-endpoint="https://api…/contact" [data-recaptcha="<v3 site key>"]
 *                 [data-action="contact"] data-message-error="…" data-message-email="…" data-message-phone="…">
 *     <form-validate> <form> named fields (sent as JSON, e.g. name, email, phone, message)
 *       [data-contact-message] (errors) </form> </form-validate>
 *     <template data-contact-success>…</template>
 *   </contact-form>
 * Listens on itself, so the fields are checked first (<form-validate> stops an invalid form before
 * the event gets here). Without data-endpoint (or without JS) the form submits normally.
 * The endpoint answers { ok: true } or { ok: false, error: invalid_email | invalid_phone | … }.
 * On success the form is replaced by the success text.
 */
let recaptcha;

// Loads reCAPTCHA v3 once, on the first submit
function loadRecaptcha(key) {
  recaptcha ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(key)}`;
    script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
    script.onerror = reject;
    document.head.append(script);
  });
  return recaptcha;
}

class ContactForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form || !this.dataset.endpoint) return;
    this.message = this.querySelector('[data-contact-message]');
    this.addEventListener('submit', this.#onSubmit);
  }

  #onSubmit = async (event) => {
    event.preventDefault();
    const button = this.form.querySelector('[type="submit"]');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    this.#error('');
    try {
      const data = Object.fromEntries(new FormData(this.form));
      if (this.dataset.recaptcha) {
        const grecaptcha = await loadRecaptcha(this.dataset.recaptcha);
        data.token = await grecaptcha.execute(this.dataset.recaptcha, { action: this.dataset.action ?? 'contact' });
      }
      const response = await fetch(this.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => ({}));
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
    this.message.textContent = text;
  }

  #done() {
    const done = this.querySelector('[data-contact-success]').content.cloneNode(true);
    this.form.replaceChildren(done);
    this.form.querySelector('[tabindex="-1"]')?.focus();
  }
}

if (!customElements.get('contact-form')) customElements.define('contact-form', ContactForm);
