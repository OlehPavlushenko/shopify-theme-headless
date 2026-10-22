/**
 * Native <dialog> drawers and modals.
 *
 * Markup contract (see snippets/drawer.liquid):
 * - [data-dialog-open="<dialog id>"] opens that dialog; on an <a>, the href stays as a no-JS fallback.
 * - [data-dialog-close] closes the closest dialog.
 * - A click on the backdrop closes the dialog: the dialog's single child fills it, so a click
 *   whose target is the <dialog> itself landed on the backdrop.
 * Esc, focus trapping and the inert page come from showModal(); focus returns to the opener on close.
 */
const openers = new WeakMap();

export function openDialog(dialog, opener = document.activeElement) {
    if (!(dialog instanceof HTMLDialogElement) || dialog.open) return;
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
