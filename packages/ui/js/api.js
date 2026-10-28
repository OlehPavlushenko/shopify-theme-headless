/**
 * Sending forms to the project's API (project-server) as JSON — the contact form, back in stock,
 * the newsletter.
 *
 *   recaptchaToken(siteKey, action) → Promise<token>: reCAPTCHA v3, Google's api.js loaded once per
 *     page, on first use (a failed load is tried again next time)
 *   postJSON(endpoint, data, { recaptcha, action }) → Promise of the parsed answer ({} when it isn't
 *     JSON); with recaptcha (a v3 site key) the body gets a `token` for that action. Rejects on a
 *     network error or when reCAPTCHA can't load.
 *   wakeWhenSeen(element, endpoint, signal): once the element comes into view, a GET to the API
 *     host's /health (once per page) — a host on a free plan sleeps when idle and needs up to a
 *     minute to wake, so it is up by the time the form is sent
 */
let recaptcha;
const woken = new Set();

export function wakeWhenSeen(element, endpoint, signal) {
  const health = new URL('/health', endpoint).href;
  if (woken.has(health)) return;
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    if (woken.has(health)) return;
    woken.add(health);
    fetch(health, { mode: 'no-cors' }).catch(() => {});
  });
  observer.observe(element);
  signal.addEventListener('abort', () => observer.disconnect());
}

function loadRecaptcha(siteKey) {
  recaptcha ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
    script.onerror = reject;
    document.head.append(script);
  }).catch((error) => {
    recaptcha = undefined;
    throw error;
  });
  return recaptcha;
}

export async function recaptchaToken(siteKey, action) {
  const grecaptcha = await loadRecaptcha(siteKey);
  return grecaptcha.execute(siteKey, { action });
}

export async function postJSON(endpoint, data, { recaptcha: siteKey, action } = {}) {
  const body = { ...data };
  if (siteKey) body.token = await recaptchaToken(siteKey, action);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json().catch(() => ({}));
}
