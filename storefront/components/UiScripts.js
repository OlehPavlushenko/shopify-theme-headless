'use client';
// The shared web components and document-level behaviors from packages/ui/js — the modules the theme's
// layout imports (snippets/import-map): header, menus, dialogs and panels, sliders, timers. Loaded after
// hydration, so they only enhance the server-rendered markup.
import { useEffect } from 'react';

export default function UiScripts() {
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
    // Loaded by their sections in the theme; here only when such a section is on the page
    if (document.querySelector('show-more')) import('@ui/show-more');
    if (document.querySelector('read-more')) import('@ui/read-more');
    if (document.querySelector('background-video')) import('@ui/background-video');
  }, []);
  return null;
}
