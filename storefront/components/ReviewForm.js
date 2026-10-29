'use client';
// The "Write a review" form in its popup (components/ProductReviews.js): name, email, a star rating, title
// and text, sent to Judge.me by the submitReview server action; the theme's success / error notices.
import { useActionState } from 'react';
import { submitReview } from '@/app/actions.js';

export default function ReviewForm({ productId, labels }) {
  const [state, send, pending] = useActionState(submitReview, null);
  if (state?.ok) {
    return (
      <p className="notice notice--success" role="status">
        {labels.success}
      </p>
    );
  }
  return (
    <form action={send} className="review-form">
      {state && !state.ok && (
        <p className="form-error" role="alert">
          {labels.error}
        </p>
      )}
      <input type="hidden" name="productId" value={productId} />
      <fieldset className="review-form__rating">
        <legend className="field__label">{labels.rating} *</legend>
        <div className="review-form__stars">
          {[5, 4, 3, 2, 1].map((value) => (
            <label key={value} className="review-form__star">
              <input type="radio" name="rating" value={value} className="visually-hidden" required defaultChecked={value === 5} />
              <span className="visually-hidden">{labels.stars[value]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="main-contact__row">
        <div className="field">
          <label className="field__label" htmlFor="ReviewName">
            {labels.name} *
          </label>
          <input className="input" id="ReviewName" name="name" autoComplete="name" required />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="ReviewEmail">
            {labels.email} *
          </label>
          <input className="input" id="ReviewEmail" name="email" type="email" autoComplete="email" spellCheck="false" required />
        </div>
      </div>
      <div className="field">
        <label className="field__label" htmlFor="ReviewTitle">
          {labels.title}
        </label>
        <input className="input" id="ReviewTitle" name="title" maxLength={100} />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="ReviewBody">
          {labels.body} *
        </label>
        <textarea className="input" id="ReviewBody" name="body" rows={5} maxLength={5000} required />
      </div>
      <button type="submit" className="btn btn--full" aria-busy={pending ? 'true' : undefined}>
        {labels.submit}
      </button>
    </form>
  );
}
