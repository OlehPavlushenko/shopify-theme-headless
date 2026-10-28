/**
 * Sending forms to the project's API (project-server) as JSON — the contact form, back in stock,
 * the newsletter.
 *
 *   recaptchaToken(siteKey, action) → Promise<token>: reCAPTCHA v3, Google's api.js loaded once per
 *     page, on first use (a failed load is tried again next time)
 *   postJSON(endpoint, data, { recaptcha, action }) → Promise of the parsed answer ({} when it isn't
 *     JSON); with recaptcha (a v3 site key) the body gets a `token` for that action. Rejects on a
 *     network error or when reCAPTCHA can't load.
 */
let recaptcha;

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
