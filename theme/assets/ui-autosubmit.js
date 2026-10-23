/* Generated from packages/ui/js/autosubmit.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Submits a form as soon as one of its controls changes: <form data-autosubmit>.
 * Used by the country/language selector. Without JS the form keeps its submit button.
 */
document.addEventListener('change', (event) => {
  const form = event.target.closest?.('form[data-autosubmit]');
  if (form) form.requestSubmit();
});
