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
    import('@ui/slider');
    import('@ui/countdown');
  }, []);
  return null;
}
