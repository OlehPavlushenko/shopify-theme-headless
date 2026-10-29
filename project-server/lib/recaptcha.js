// reCAPTCHA v3 check. Off when RECAPTCHA_SECRET is not set (local development).
const MIN_SCORE = 0.5;

export const recaptchaEnabled = Boolean(process.env.RECAPTCHA_SECRET);

// Why the token fails, or null when it passes: no token, Google's error codes (a wrong secret, a domain
// not on the key, an expired token), another action or a low score. The reason is logged and returned to
// the form's response (no secrets in it), so a failing setup shows its cause.
export async function captchaFailure(token, action) {
  if (!recaptchaEnabled) return null;
  if (!token) return 'no-token';
  let reason;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token }),
    });
    const result = await response.json();
    if (!result.success) reason = (result['error-codes'] ?? ['not-success']).join(',');
    else if (result.action !== action) reason = `action ${result.action} (expected ${action})`;
    else if (!(result.score >= MIN_SCORE)) reason = `score ${result.score} (below ${MIN_SCORE}) on ${result.hostname}`;
    else return null;
  } catch (error) {
    reason = `siteverify unreachable: ${error.message}`;
  }
  console.warn(`reCAPTCHA failed (${action}): ${reason}`);
  return reason;
}
