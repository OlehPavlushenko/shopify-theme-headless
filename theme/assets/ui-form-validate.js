/* Generated from packages/ui/js/form-validate.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <form-validate> — checks a form's fields before it is sent, with messages under the fields
 * instead of the browser's bubbles (they look different in every browser and speak the browser's
 * language, not the store's).
 * - uses the fields' own rules (required, type="email", pattern, minlength); a field of only
 *   spaces counts as empty;
 * - on submit: every invalid field gets aria-invalid and its message ([data-field-error] after it,
 *   linked by aria-describedby), the first one gets focus; nothing is sent;
 * - a flagged field is checked again as it is edited, and its message goes once it is valid.
 * Messages come from the element: data-message-required, data-message-email, data-message-invalid.
 * Without JS the form keeps the browser's own checks (the novalidate is set here).
 *
 *   <form-validate data-message-required="…" data-message-email="…" data-message-invalid="…">
 *     <form> … </form>
 *   </form-validate>
 */
const FIELDS = 'input:not([type="hidden"], [type="submit"], [type="button"]), textarea, select';
// Message ids for fields without an id of their own (unique on the page)
let uid = 0;

class FormValidate extends HTMLElement {
  connectedCallback() {
    this.form = this.querySelector('form');
    if (!this.form) return;
    this.form.noValidate = true;
    this.form.addEventListener('submit', this.#onSubmit);
    this.form.addEventListener('input', this.#onInput);
  }

  // Runs before other submit listeners added later (an AJAX form stops when this prevents it)
  #onSubmit = (event) => {
    // formnovalidate on the button that sent it (e.g. "Decline") skips the checks
    if (event.submitter?.formNoValidate) return;
    const invalid = [...this.form.querySelectorAll(FIELDS)].filter((field) => !this.#check(field));
    if (!invalid.length) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    invalid[0].focus();
  };

  #onInput = (event) => {
    if (event.target.matches?.('[aria-invalid="true"]')) this.#check(event.target);
  };

  // Shows or clears the field's message; true when the field is valid
  #check(field) {
    // Spaces only: the browser counts them as a value
    const blank = field.required && field.type !== 'checkbox' && field.value.trim() === '';
    field.setCustomValidity(blank ? 'blank' : '');
    const { validity } = field;
    let message = '';
    if (validity.valueMissing || validity.customError) message = this.dataset.messageRequired;
    else if (validity.typeMismatch && field.type === 'email') message = this.dataset.messageEmail;
    else if (!validity.valid) message = field.dataset.messageInvalid || this.dataset.messageInvalid;
    this.#show(field, message ?? '');
    return validity.valid;
  }

  #show(field, message) {
    let error = this.#errorOf(field);
    if (!message) {
      field.removeAttribute('aria-invalid');
      if (error) {
        const ids = field
          .getAttribute('aria-describedby')
          .split(' ')
          .filter((id) => id !== error.id);
        if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
        else field.removeAttribute('aria-describedby');
        error.remove();
      }
      return;
    }
    if (!error) {
      error = document.createElement('span');
      error.className = 'field-error';
      error.dataset.fieldError = '';
      error.id = `${field.id || `field-${++uid}`}-error`;
      field.after(error);
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), error.id].filter(Boolean).join(' '));
    }
    field.setAttribute('aria-invalid', 'true');
    error.textContent = message;
  }

  #errorOf(field) {
    const next = field.nextElementSibling;
    return next?.hasAttribute('data-field-error') ? next : null;
  }
}

if (!customElements.get('form-validate')) customElements.define('form-validate', FormValidate);
