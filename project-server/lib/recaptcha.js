// reCAPTCHA v3 check. Off when RECAPTCHA_SECRET is not set (local development).
const MIN_SCORE = 0.5;

export const recaptchaEnabled = Boolean(process.env.RECAPTCHA_SECRET);

export async function verifyRecaptcha(token, action) {
  if (!recaptchaEnabled) return true;
  if (!token) return false;
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token }),
    });
    const result = await response.json();
    return result.success && result.action === action && result.score >= MIN_SCORE;
  } catch (error) {
    console.error('reCAPTCHA check failed:', error.message);
    return false;
  }
}
