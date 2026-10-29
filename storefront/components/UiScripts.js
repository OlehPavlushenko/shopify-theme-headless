'use client';
// The shared web components and document-level behaviors from packages/ui/js — the modules the theme's
// layout imports (snippets/import-map): header, menus, dialogs and panels, sliders, timers. Loaded after
// hydration, so they only enhance the server-rendered markup.
// Also the menus' current-page marks, which Liquid renders (link.active / child_active, link.current):
// here they follow the path after every navigation, so the layout stays static.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

function markCurrent(pathname) {
  for (const link of document.querySelectorAll('.site-nav a, .mobile-nav a')) {
    if (new URL(link.href).pathname === pathname) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  }
  for (const item of document.querySelectorAll('.site-nav__item')) {
    const active = [...item.querySelectorAll('a')].some((link) => new URL(link.href).pathname === pathname);
    item.querySelector('.site-nav__link')?.classList.toggle('is-active', active);
  }
}

export default function UiScripts() {
  const pathname = usePathname();

  useEffect(() => {
    import('@ui/dialog');
    import('@ui/header');
    import('@ui/nav-menu');
    import('@ui/drill-menu');
    import('@ui/predictive-search');
    import('@ui/form-validate');
    import('@ui/slider');
    import('@ui/countdown');
    import('@ui/footer');
    import('@ui/newsletter');
    import('@ui/saved-list');
  }, []);

  useEffect(() => {
    markCurrent(pathname);
    // Loaded by their sections in the theme; here only when such a section is on the page
    if (document.querySelector('show-more')) import('@ui/show-more');
    if (document.querySelector('read-more')) import('@ui/read-more');
    if (document.querySelector('background-video')) import('@ui/background-video');
  }, [pathname]);

  return null;
}
