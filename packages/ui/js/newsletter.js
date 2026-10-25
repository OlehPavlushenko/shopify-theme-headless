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
 * On success the fields are replaced by the success text and newsletter:subscribed is dispatched.
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

class NewsletterForm extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form || !this.dataset.endpoint) return;
    this.input = this.form.querySelector('input[type="email"]');
    this.message = this.querySelector('[data-newsletter-message]');
    this.form.addEventListener('submit', this.#onSubmit);
  }

  #onSubmit = async (event) => {
    event.preventDefault();
    const email = this.input.value.trim();
    if (!this.input.checkValidity() || !email) return this.#error(this.dataset.messageInvalid);

    const button = this.form.querySelector('[type="submit"]');
    button.setAttribute('aria-busy', 'true');
    button.disabled = true;
    this.#error('');
    try {
      const token = this.dataset.recaptcha
        ? await (await loadRecaptcha(this.dataset.recaptcha)).execute(this.dataset.recaptcha, { action: 'newsletter' })
        : undefined;
      const response = await fetch(this.dataset.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });
      const result = await response.json().catch(() => ({}));
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
    this.message.textContent = text;
    this.input.toggleAttribute('aria-invalid', Boolean(text));
  }

  #done(status) {
    const template = this.querySelector(status === 'already_subscribed' ? '[data-newsletter-already]' : '[data-newsletter-success]');
    const done = document.createElement('div');
    done.className = 'newsletter-form__done';
    done.setAttribute('role', 'status');
    done.append(template.content.cloneNode(true));
    this.form.replaceChildren(done);
    this.dispatchEvent(new CustomEvent('newsletter:subscribed', { bubbles: true, detail: { status } }));
  }
}

if (!customElements.get('newsletter-form')) customElements.define('newsletter-form', NewsletterForm);
