/* Generated from packages/ui/js/toast.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Toast: a short notice at the bottom of the page ("Saved to wishlist · View").
 *
 *   showToast({ message, image?, action?: { label, href } | { label, onClick } })
 *
 * One toast at a time (a new one replaces the shown one). Lives in a polite live region, so screen
 * readers announce it. Hides after DURATION, not while hovered or focused; closing plays the leaving
 * transition ([data-closing], as in @ui/dialog). Styles: .toast in components.css.
 */
const DURATION = 4000;
let region;
let timer;

function getRegion() {
  if (!region?.isConnected) {
    region = document.createElement('div');
    region.className = 'toasts';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.append(region);
  }
  return region;
}

function hide(toast) {
  if (!toast.isConnected || toast.hasAttribute('data-closing')) return;
  toast.setAttribute('data-closing', '');
  toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  setTimeout(() => toast.remove(), 400); // no transition (reduced motion)
}

export function showToast({ message, image, action }) {
  const toasts = getRegion();
  toasts.querySelectorAll('.toast').forEach(hide);
  clearTimeout(timer);

  const toast = document.createElement('div');
  toast.className = 'toast';
  if (image) {
    const img = document.createElement('img');
    img.className = 'toast__image';
    img.src = image;
    img.alt = '';
    toast.append(img);
  }
  const text = document.createElement('p');
  text.className = 'toast__message';
  text.textContent = message;
  toast.append(text);

  if (action) {
    const link = document.createElement(action.href ? 'a' : 'button');
    link.className = 'toast__action';
    link.textContent = action.label;
    if (action.href) link.href = action.href;
    else {
      link.type = 'button';
      link.addEventListener('click', () => {
        action.onClick();
        hide(toast);
      });
    }
    toast.append(link);
  }

  const start = () => (timer = setTimeout(() => hide(toast), DURATION));
  toast.addEventListener('pointerenter', () => clearTimeout(timer));
  toast.addEventListener('pointerleave', start);
  toast.addEventListener('focusin', () => clearTimeout(timer));
  toast.addEventListener('focusout', start);
  toasts.append(toast);
  start();
  return toast;
}
