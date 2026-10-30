'use client';
// The shared web components and document-level behaviors from packages/ui/js — the modules the theme's
// layout imports (snippets/import-map): header, menus, dialogs and panels, sliders, timers. Loaded after
// hydration, so they only enhance the server-rendered markup.
// Also the menus' current-page marks, which Liquid renders (link.active / child_active, link.current):
// here they follow the path after every navigation, so the layout stays static.
import { useEffect } from 'react';
import { unstable_isUnrecognizedActionError, usePathname } from 'next/navigation';

// Promo popups for some pages only (their "Pages" setting): left out elsewhere, before they arm
function limitPopups(pathname) {
  for (const popup of document.querySelectorAll('promo-popup[data-pages]')) {
    const { pages } = popup.dataset;
    if ((pages === 'home' && pathname !== '/') || (pages === 'not_cart' && pathname === '/cart')) popup.remove();
  }
}

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

  // A page from an earlier deploy calls server actions the new one doesn't have (add to cart after a
  // release): reload it once to get the current build (not again within 30 s, so it can't loop)
  useEffect(() => {
    const onRejection = (event) => {
      if (!unstable_isUnrecognizedActionError(event.reason)) return;
      try {
        if (Date.now() - Number(sessionStorage.getItem('action-reload') ?? 0) < 30_000) return;
        sessionStorage.setItem('action-reload', String(Date.now()));
      } catch {
        // Storage off: reload anyway
      }
      location.reload();
    };
    addEventListener('unhandledrejection', onRejection);
    return () => removeEventListener('unhandledrejection', onRejection);
  }, []);

  useEffect(() => {
    // What the first screen uses: panels and menus, sliders, timers, the add-to-cart buttons
    import('@ui/dialog');
    import('@ui/header');
    import('@ui/nav-menu');
    import('@ui/drill-menu');
    import('@ui/slider');
    import('@ui/countdown');
    import('@/lib/cart-elements.js');
    // The rest once the page is idle (2 s at most), off the load's main thread: live search, form checks,
    // footer accordions, sign-up, wishlist / compare toggles, quick view, the cart's recommendations
    const later = () => {
      import('@ui/predictive-search');
      import('@ui/form-validate');
      import('@ui/footer');
      import('@ui/newsletter');
      import('@ui/saved-list');
      import('@ui/quick-view');
      import('@/lib/cart-recommendations.js');
      if (document.querySelector('cookie-banner')) import('@ui/cookie-banner');
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(later, { timeout: 2000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(later, 1);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    markCurrent(pathname);
    limitPopups(pathname);
    // Loaded by their sections in the theme; here only when such a section is on the page
    if (document.querySelector('promo-popup')) import('@ui/promo-popup');
    if (document.querySelector('spin-wheel')) import('@ui/spin-wheel');
    if (document.querySelector('show-more')) import('@ui/show-more');
    if (document.querySelector('read-more')) import('@ui/read-more');
    if (document.querySelector('background-video')) import('@ui/background-video');
    if (document.querySelector('saved-products')) import('@ui/saved-pages');
    if (document.querySelector('facet-filters')) import('@ui/facets');
    if (document.querySelector('product-info')) import('@ui/variant-picker');
    if (document.querySelector('product-gallery, product-recommendations, sticky-buy-bar')) import('@ui/product');
    if (document.querySelector('quantity-breaks')) import('@ui/quantity-breaks');
    if (document.querySelector('contact-form')) import('@ui/contact-form');
    if (document.querySelector('load-more')) import('@ui/load-more');
    if (document.querySelector('delivery-steps')) import('@ui/delivery-steps');
    if (document.querySelector('lazy-section')) import('@ui/lazy-section');
    if (document.querySelector('section-swap')) import('@ui/section-swap');
    if (document.querySelector('article-toc')) import('@ui/article-toc');
    if (document.querySelector('faq-search')) import('@ui/faq-search');
    if (document.querySelector('ui-tabs')) import('@ui/tabs');
    if (document.querySelector('age-gate')) import('@ui/age-gate');
  }, [pathname]);

  return null;
}
