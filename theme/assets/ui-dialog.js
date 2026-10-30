/* Generated from packages/ui/js/dialog.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Native <dialog> drawers and modals, and side panels on the Popover API.
 *
 * Framework-agnostic: works with any server- or client-rendered markup that follows the contract.
 *
 * Markup contract (styles: .drawer / .popup in components.css):
 * - [data-dialog-open="<dialog id>"] opens that dialog; on an <a>, the href stays as a no-JS fallback.
 * - [data-dialog-close] closes the closest dialog.
 * - A click on the backdrop closes the dialog: the dialog's single child fills it, so a click
 *   whose target is the <dialog> itself landed on the backdrop.
 * - [data-dialog-locked] on a dialog: neither Esc nor the backdrop closes it, only its own buttons
 *   (the age verification).
 * - Panels: <div popover="manual"> opened by [popovertarget] buttons (popovertargetaction="hide"
 *   closes). This module handles those clicks, Esc and clicks outside the panel (light dismiss),
 *   and keeps one panel open at a time.
 * Esc, focus trapping and the inert page of dialogs come from showModal(); focus returns to the
 * opener on close.
 * Scroll lock: <html data-scroll-lock> while a modal dialog or a side panel (.drawer / .menu-panel
 * popover) is open; components.css hides the page scrollbar from it.
 *
 * Closing is animated by the CSS itself: [data-closing] is set first, the element keeps [open] /
 * :popover-open while its leaving transition runs, then it is closed. (Exit transitions of the top
 * layer — `overlay`, `display: allow-discrete` — aren't supported everywhere, this works in every
 * browser.) Styles therefore put the open look on `[open]:not([data-closing])`.
 */
const openers = new WeakMap();
const root = document.documentElement;
const LOCKING = 'dialog[open]:modal, [popover].drawer:popover-open, [popover].menu-panel:popover-open';

// Scrollbar width for the scroll lock (components.css pads <html> by it while an overlay is open).
// Measured right before an overlay opens (not at page load: reading layout then forces a reflow
// while the page is still rendering). Not while one is open: the page scrollbar is hidden then.
function measureScrollbar() {
  const width = window.innerWidth - root.clientWidth;
  if (width >= 0 && !root.hasAttribute('data-scroll-lock')) root.style.setProperty('--scrollbar-width', `${width}px`);
}

function updateScrollLock() {
  root.toggleAttribute('data-scroll-lock', !!document.querySelector(LOCKING));
}

// Longest transition of the element (duration + delay), in ms
function transitionTime(element) {
  const style = getComputedStyle(element);
  const ms = (value) => value.split(',').map((part) => parseFloat(part) * (part.trim().endsWith('ms') ? 1 : 1000));
  const durations = ms(style.transitionDuration);
  const delays = ms(style.transitionDelay);
  return Math.max(0, ...durations.map((duration, i) => duration + (delays[i % delays.length] || 0)));
}

// Plays the leaving transition ([data-closing]), then runs close()
const closing = new WeakMap();
function closeAnimated(element, close) {
  if (element.hasAttribute('data-closing')) return;
  element.setAttribute('data-closing', '');
  closing.set(
    element,
    setTimeout(() => {
      closing.delete(element);
      close();
      element.removeAttribute('data-closing');
      updateScrollLock();
    }, transitionTime(element))
  );
}

// Opened again while its leaving transition plays: stays open. True when that happened.
function cancelClose(element) {
  if (!closing.has(element)) return false;
  clearTimeout(closing.get(element));
  closing.delete(element);
  element.removeAttribute('data-closing');
  return true;
}

export function openDialog(dialog, opener = document.activeElement) {
  if (!(dialog instanceof HTMLDialogElement) || cancelClose(dialog) || dialog.open) return;
  measureScrollbar();
  openers.set(dialog, opener);
  dialog.showModal();
  updateScrollLock();
  dialog.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true }));
}

export function closeDialog(dialog) {
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open) return;
  closeAnimated(dialog, () => dialog.close());
}

const openPanels = () => [...document.querySelectorAll('[popover="manual"]:popover-open')];

export function openPanel(panel) {
  if (cancelClose(panel) || panel.matches(':popover-open')) return;
  for (const other of openPanels()) closePanel(other);
  measureScrollbar();
  panel.showPopover();
  updateScrollLock();
}

export function closePanel(panel) {
  if (!panel.matches(':popover-open')) return;
  closeAnimated(panel, () => panel.hidePopover());
}

document.addEventListener('click', (event) => {
  const panelButton = event.target.closest('[popovertarget]');
  const panel = panelButton && document.getElementById(panelButton.getAttribute('popovertarget'));
  if (panel?.popover === 'manual') {
    event.preventDefault(); // the native toggle would close without the leaving animation
    const action = panelButton.getAttribute('popovertargetaction') || 'toggle';
    const open = panel.matches(':popover-open') && !panel.hasAttribute('data-closing');
    if (action === 'hide' || (action === 'toggle' && open)) closePanel(panel);
    else openPanel(panel);
    return;
  }

  const opener = event.target.closest('[data-dialog-open]');
  if (opener) {
    const dialog = document.getElementById(opener.dataset.dialogOpen);
    if (dialog instanceof HTMLDialogElement) {
      event.preventDefault();
      openDialog(dialog, opener);
    }
    return;
  }

  const closer = event.target.closest('[data-dialog-close]');
  if (closer) {
    event.preventDefault();
    closeDialog(closer.closest('dialog'));
    return;
  }

  if (event.target instanceof HTMLDialogElement && !event.target.hasAttribute('data-dialog-locked')) closeDialog(event.target);
});

// Light dismiss for panels: a press outside the panel (and outside its own buttons) closes it
document.addEventListener('pointerdown', (event) => {
  for (const panel of openPanels()) {
    if (panel.contains(event.target)) continue;
    if (event.target.closest(`[popovertarget="${CSS.escape(panel.id)}"]`)) continue;
    closePanel(panel);
  }
});

// Esc: the dialog's own cancel is replaced by the animated close; open panels close too
document.addEventListener(
  'cancel',
  (event) => {
    if (!(event.target instanceof HTMLDialogElement)) return;
    event.preventDefault();
    if (!event.target.hasAttribute('data-dialog-locked')) closeDialog(event.target);
  },
  true
);
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || document.querySelector('dialog[open]:modal')) return;
  const panels = openPanels();
  if (panels.length) closePanel(panels.at(-1));
});

// Dialogs and popovers opened or closed without this module (showModal() / close() called
// directly) keep the scroll lock right too: a dialog's [open] changes, a popover fires toggle
new MutationObserver(updateScrollLock).observe(root, { attributeFilter: ['open'], subtree: true });
document.addEventListener('toggle', updateScrollLock, true);

document.addEventListener(
  'close',
  (event) => {
    if (!(event.target instanceof HTMLDialogElement)) return;
    const opener = openers.get(event.target);
    if (opener?.isConnected) opener.focus({ preventScroll: true });
    openers.delete(event.target);
  },
  true
);
