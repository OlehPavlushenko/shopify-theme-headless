/* Generated from packages/ui/js/age-gate.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <age-gate> — the age verification window: open over the store until the visitor confirms their age.
 *
 * Markup contract:
 *   <age-gate data-days="30" data-exit="https://…">
 *     <dialog> … <button data-age-yes>…</button> <button data-age-no>…</button> </dialog>
 *   </age-gate>
 * Opens the dialog (modal) when there is no answer from the last data-days days. "Yes" keeps the answer
 * in the browser and closes it; "No" leaves for data-exit (empty: the previous site, else google.com).
 * Esc and the backdrop don't close it ([data-dialog-locked], @ui/dialog): the visitor answers.
 */
import { closeDialog, openDialog } from '@ui/dialog';
import { get, set } from '@ui/storage';

const KEY = 'age-confirmed';
const DAY = 24 * 60 * 60 * 1000;

class AgeGate extends HTMLElement {
  #abort;

  connectedCallback() {
    const dialog = this.querySelector('dialog');
    const confirmed = Number(get(KEY));
    if (!dialog || (confirmed && Date.now() - confirmed < (Number(this.dataset.days) || 30) * DAY)) return;
    const { signal } = (this.#abort = new AbortController());
    this.querySelector('[data-age-yes]')?.addEventListener('click', () => this.#confirm(dialog), { signal });
    this.querySelector('[data-age-no]')?.addEventListener('click', this.#leave, { signal });
    openDialog(dialog);
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  #confirm(dialog) {
    set(KEY, String(Date.now()));
    closeDialog(dialog);
  }

  #leave = () => {
    const back = document.referrer && new URL(document.referrer).origin !== location.origin ? document.referrer : null;
    location.href = this.dataset.exit || back || 'https://www.google.com';
  };
}

if (!customElements.get('age-gate')) customElements.define('age-gate', AgeGate);
