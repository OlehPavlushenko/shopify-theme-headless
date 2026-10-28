/**
 * Third-party scripts from Theme settings > Integrations > "Third-party scripts" (layout/theme.liquid
 * puts them in <template id="DeferredScripts">): they start on the visitor's first interaction
 * (pointer, key, scroll, touch) or after 6 s, whichever comes first — not during the page load,
 * so a chat or a recorder doesn't slow the first screen down.
 *
 * Scripts from a template don't run when inserted: each one is recreated. External ones keep their
 * order (async = false), inline ones run when they are reached.
 */
const IDLE = 6000;
const EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'];

function start() {
  const template = document.getElementById('DeferredScripts');
  if (!template) return;
  const content = template.content;
  template.remove();
  for (const old of content.querySelectorAll('script')) {
    const script = document.createElement('script');
    for (const { name, value } of old.attributes) script.setAttribute(name, value);
    if (old.src) script.async = false;
    else script.textContent = old.textContent;
    old.replaceWith(script);
  }
  document.body.append(content);
}

const abort = new AbortController();
const once = () => {
  abort.abort();
  clearTimeout(timer);
  start();
};
const timer = setTimeout(once, IDLE);
for (const type of EVENTS) addEventListener(type, once, { once: true, passive: true, signal: abort.signal });
