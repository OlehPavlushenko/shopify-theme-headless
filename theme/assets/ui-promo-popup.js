/* Generated from packages/ui/js/promo-popup.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <promo-popup> — opens its <dialog> once one of its triggers fires, and remembers the shopper's
 * answer so it does not come back too soon.
 *
 * Attributes:
 * - data-id       storage key (unique per popup)
 * - data-delay    seconds after the page loads (empty = off; 0 = right away)
 * - data-scroll   percent of the page scrolled (0 = off)
 * - data-exit     present: when the pointer leaves the window at the top (desktop exit intent)
 * - data-days     after closing, don't show again for this many days (0 = until the browser session ends)
 * After a newsletter sign-up inside it (newsletter:subscribed) it stays away for a year. It doesn't
 * show at all once what it asks for is done on this device: its wheel spun, or (a sign-up popup) the
 * newsletter signed up in any form.
 * One promo popup per page view: once one has opened, the others' triggers are ignored.
 * In the theme editor it opens while its section is selected instead of on the triggers.
 * Opening and closing go through @ui/dialog (animated, focus handling).
 */
import { openDialog, closeDialog } from '@ui/dialog';
import * as storage from '@ui/storage';

const DAY = 86_400_000;
let shown = false;
const YEAR_DAYS = 365;

const read = (key) => Number(storage.get(key) || storage.get(key, { session: true }) || 0);

// Never shortens a longer period already stored (a sign-up keeps it away for a year, closing after it must not cut that)
function remember(key, days) {
  if (days > 0) {
    const until = Date.now() + days * DAY;
    if (until > read(key)) storage.set(key, until);
  } else {
    storage.set(key, Number.MAX_SAFE_INTEGER, { session: true });
  }
}

class PromoPopup extends HTMLElement {
  #abort;
  #triggers;
  #timer;
  #ticking = false;
  #dialog;
  #key;

  connectedCallback() {
    this.#dialog = this.querySelector('dialog');
    this.#key = `promo-popup:${this.dataset.id}`;
    if (!this.#dialog) return;

    const { signal } = (this.#abort = new AbortController());
    this.#dialog.addEventListener('close', this.#onClose, { signal });
    this.addEventListener('newsletter:subscribed', this.#onSubscribed, { signal });

    if (window.Shopify?.designMode) return this.#editorMode(signal);
    if (read(this.#key) > Date.now() || this.#done()) return;
    this.#arm();
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#disarm();
  }

  #onClose = () => {
    if (!window.Shopify?.designMode) remember(this.#key, Number(this.dataset.days) || 0);
  };

  #onSubscribed = () => remember(this.#key, YEAR_DAYS);

  // What it asks for is done on this device: its wheel spun (spin-wheel:<key>), or — a sign-up popup
  // without a wheel — the newsletter signed up in any form (newsletter:subscribed)
  #done() {
    const wheel = this.querySelector('spin-wheel');
    if (wheel) return Boolean(storage.get(`spin-wheel:${wheel.dataset.key}`));
    return Boolean(this.querySelector('newsletter-form') && storage.get('newsletter:subscribed'));
  }

  #open = () => {
    this.#disarm();
    if (shown || document.querySelector('dialog[open]:modal')) return;
    shown = true;
    openDialog(this.#dialog, null);
  };

  // The triggers go once one has fired (or the element leaves the page)
  #disarm() {
    this.#triggers?.abort();
    clearTimeout(this.#timer);
  }

  #arm() {
    const { signal } = (this.#triggers = new AbortController());
    const delay = this.dataset.delay;
    if (delay !== undefined && delay !== '') this.#timer = setTimeout(this.#open, Number(delay) * 1000);
    if (Number(this.dataset.scroll) > 0) addEventListener('scroll', this.#onScroll, { passive: true, signal });
    if (this.hasAttribute('data-exit') && matchMedia('(hover: hover)').matches) {
      document.addEventListener('mouseout', this.#onLeave, { signal });
    }
  }

  // Checked once per frame, not on every scroll event
  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      if (this.#triggers?.signal.aborted) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0 && (scrollY / max) * 100 >= Number(this.dataset.scroll)) this.#open();
    });
  };

  #onLeave = (event) => {
    if (!event.relatedTarget && event.clientY <= 0) this.#open();
  };

  // Theme editor: open while its section is selected
  #editorMode(signal) {
    document.addEventListener('shopify:section:select', this.#onSectionSelect, { signal });
    document.addEventListener('shopify:section:deselect', this.#onSectionDeselect, { signal });
  }

  #onSectionSelect = (event) => {
    if (event.target === this.closest('.shopify-section')) openDialog(this.#dialog, null);
  };

  #onSectionDeselect = (event) => {
    if (event.target === this.closest('.shopify-section')) closeDialog(this.#dialog);
  };
}

if (!customElements.get('promo-popup')) customElements.define('promo-popup', PromoPopup);
