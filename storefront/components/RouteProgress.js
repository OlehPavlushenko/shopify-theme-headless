'use client';
// What a full page load shows in the theme, for Next.js links that swap the page in place:
// - a click on a link to another page closes what is open over the page at once — a mega menu, the
//   mobile menu and other side panels (popovers), the search panel, the cart drawer, popups (dialogs);
// - a bar at the top of the window runs until the new page is in (its path or query shows).
// Only <Link>s: the links UI modules take over (dialogs, quick view, <section-swap>) are left to them. Styles:
// .route-progress in components.css.
import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// The longest a navigation shows the bar (a failed one never ends)
const MAX_TIME = 15_000;

async function closeOverlays() {
  const { closeDialog, closePanel } = await import('@ui/dialog');
  for (const item of document.querySelectorAll('[data-menu-item][data-open]')) {
    item.removeAttribute('data-open');
    item.querySelector('[aria-controls]')?.setAttribute('aria-expanded', 'false');
  }
  document.querySelectorAll('[popover]:popover-open').forEach(closePanel);
  document.querySelectorAll('dialog[open]').forEach(closeDialog);
}

// A Next.js <Link>: the anchor React gave a click handler. Plain <a> are ordinary links (a full page load)
// or ones a UI module takes over — the search and cart icons, quick view, "Load more", filters
const isNextLink = (link) => Boolean(link[Object.keys(link).find((key) => key.startsWith('__reactProps$'))]?.onClick);

// The page a click leaves for, if Next.js handles it (a <Link> to another page, a plain click)
function navigationOf(event) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const link = event.target.closest('a[href]');
  if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return null;
  if (link.closest('section-swap') || !isNextLink(link)) return null;
  const url = new URL(link.href);
  if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return null;
  return url;
}

export default function RouteProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [state, setState] = useState('idle');

  useEffect(() => {
    // Capture: before Next.js' own handler (it calls preventDefault on links it navigates with)
    const onClick = (event) => {
      if (!navigationOf(event)) return;
      // A click Next.js didn't take loads the page as usual (the browser shows that)
      setTimeout(() => {
        if (!event.defaultPrevented) return;
        closeOverlays();
        setState('loading');
      });
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // The new page is in: the bar fills up and fades
  useEffect(() => {
    setState((current) => (current === 'loading' ? 'done' : current));
  }, [pathname, search]);

  useEffect(() => {
    if (state === 'idle') return;
    const id = setTimeout(() => setState('idle'), state === 'done' ? 400 : MAX_TIME);
    return () => clearTimeout(id);
  }, [state]);

  return <div className="route-progress" data-state={state} aria-hidden="true" />;
}
