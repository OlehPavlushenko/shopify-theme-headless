'use client';
// A form that runs a cart server action (app/actions.js), then dispatches cart:changed (the header's
// count). Without JS it still posts the action. aria-busy on the form while it runs.
import { useTransition } from 'react';

export default function CartForm({ action, className, children }) {
  const [pending, startTransition] = useTransition();
  const run = (formData) =>
    startTransition(async () => {
      await action(formData);
      dispatchEvent(new Event('cart:changed'));
    });
  return (
    <form action={run} className={className} aria-busy={pending || undefined}>
      {children}
    </form>
  );
}
