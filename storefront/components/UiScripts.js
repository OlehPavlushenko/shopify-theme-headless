'use client';
// The shared web components and document-level behaviors from packages/ui/js, the same modules the
// theme loads: <site-header>, <drill-menu>, dialogs and popover panels (@ui/dialog). Loaded after
// hydration, so they only enhance the server-rendered markup.
import { useEffect } from 'react';

export default function UiScripts() {
  useEffect(() => {
    import('@ui/dialog');
    import('@ui/header');
    import('@ui/drill-menu');
  }, []);
  return null;
}
