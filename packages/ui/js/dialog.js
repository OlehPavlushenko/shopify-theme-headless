/**
 * Native <dialog> drawers and modals.
 *
 * Framework-agnostic: works with any server- or client-rendered markup that follows the contract.
 *
 * Markup contract (styles: .drawer / .popup in components.css):
 * - [data-dialog-open="<dialog id>"] opens that dialog; on an <a>, the href stays as a no-JS fallback.
 * - [data-dialog-close] closes the closest dialog.
 * - A click on the backdrop closes the dialog: the dialog's single child fills it, so a click
 *   whose target is the <dialog> itself landed on the backdrop.
 * Esc, focus trapping and the inert page come from showModal(); focus returns to the opener on close.
 */
const openers = new WeakMap();

// Scrollbar width for the scroll lock (components.css pads <html> by it while an overlay is open).
// Not measured while one is open: the page scrollbar is hidden then.
function measureScrollbar() {
  const width = window.innerWidth - document.documentElement.clientWidth;
  if (width >= 0 && !document.documentElement.matches(':has(dialog[open]:modal, [popover]:popover-open)')) {
    document.documentElement.style.setProperty('--scrollbar-width', `${width}px`);
  }
}
measureScrollbar();
window.addEventListener('resize', measureScrollbar, { passive: true });

export function openDialog(dialog, opener = document.activeElement) {
  if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
  measureScrollbar();
  openers.set(dialog, opener);
  dialog.showModal();
  dialog.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true }));
}

export function closeDialog(dialog) {
  if (dialog instanceof HTMLDialogElement && dialog.open) dialog.close();
}

document.addEventListener('click', (event) => {
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

  if (event.target instanceof HTMLDialogElement) closeDialog(event.target);
});

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
