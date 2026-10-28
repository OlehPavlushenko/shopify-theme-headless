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
 * After a newsletter sign-up inside it (newsletter:subscribed) it stays away for a year.
 * One promo popup per page view: once one has opened, the others' triggers are ignored.
 * In the theme editor it opens while its section is selected instead of on the triggers.
 * Opening and closing go through @ui/dialog (animated, focus handling).
 */
import { openDialog, closeDialog } from '@ui/dialog';

const DAY = 86_400_000;
let shown = false;
const YEAR_DAYS = 365;

function read(key) {
  try {
    return Number(localStorage.getItem(key) || sessionStorage.getItem(key) || 0);
  } catch {
    return 0;
  }
}

// Never shortens a longer period already stored (a sign-up keeps it away for a year, closing after it must not cut that)
function remember(key, days) {
  try {
    if (days > 0) {
      const until = Date.now() + days * DAY;
      if (until > read(key)) localStorage.setItem(key, String(until));
    } else {
      sessionStorage.setItem(key, String(Number.MAX_SAFE_INTEGER));
    }
  } catch {}
}

class PromoPopup extends HTMLElement {
  #cleanup = [];

  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.key = `promo-popup:${this.dataset.id}`;
    if (!this.dialog) return;

    this.dialog.addEventListener('close', () => {
      if (!window.Shopify?.designMode) remember(this.key, Number(this.dataset.days) || 0);
    });
    this.addEventListener('newsletter:subscribed', () => remember(this.key, YEAR_DAYS));

    if (window.Shopify?.designMode) return this.#editorMode();
    if (read(this.key) > Date.now()) return;
    this.#arm();
  }

  disconnectedCallback() {
    for (const off of this.#cleanup) off();
  }

  #open = () => {
    for (const off of this.#cleanup) off();
    this.#cleanup = [];
    if (shown || document.querySelector('dialog[open]:modal')) return;
    shown = true;
    openDialog(this.dialog, null);
  };

  #arm() {
    const delay = this.dataset.delay;
    if (delay !== undefined && delay !== '') {
      const timer = setTimeout(this.#open, Number(delay) * 1000);
      this.#cleanup.push(() => clearTimeout(timer));
    }

    const percent = Number(this.dataset.scroll);
    if (percent > 0) {
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - innerHeight;
        if (max > 0 && (scrollY / max) * 100 >= percent) this.#open();
      };
      addEventListener('scroll', onScroll, { passive: true });
      this.#cleanup.push(() => removeEventListener('scroll', onScroll));
    }

    if (this.hasAttribute('data-exit') && matchMedia('(hover: hover)').matches) {
      const onLeave = (event) => {
        if (!event.relatedTarget && event.clientY <= 0) this.#open();
      };
      document.addEventListener('mouseout', onLeave);
      this.#cleanup.push(() => document.removeEventListener('mouseout', onLeave));
    }
  }

  #editorMode() {
    const section = this.closest('.shopify-section');
    document.addEventListener('shopify:section:select', (event) => {
      if (event.target === section) openDialog(this.dialog, null);
    });
    document.addEventListener('shopify:section:deselect', (event) => {
      if (event.target === section) closeDialog(this.dialog);
    });
  }
}

if (!customElements.get('promo-popup')) customElements.define('promo-popup', PromoPopup);
