/* Generated from packages/ui/js/clipboard.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * Copying text, with a short confirmation on a label — pure helpers.
 *
 *   copyText(text) → Promise<boolean>: true once copied; false without the Clipboard API (an insecure
 *     page, an old browser) or when the browser refuses
 *   flashLabel(element, text, ms = 2000): shows text in place of the element's label, then restores
 *     the label; a second call while it shows is ignored (the label never sticks on the flash text)
 */
export async function copyText(text) {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const flashing = new WeakSet();

export function flashLabel(element, text, ms = 2000) {
  if (!element || flashing.has(element)) return;
  flashing.add(element);
  const label = element.textContent;
  element.textContent = text;
  setTimeout(() => {
    element.textContent = label;
    flashing.delete(element);
  }, ms);
}
