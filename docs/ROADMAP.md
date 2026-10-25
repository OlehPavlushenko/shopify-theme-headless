# Roadmap and decisions

What the theme already has, what comes next, and why things are built the way they are.
How the code is written lives in [ARCHITECTURE.md](../ARCHITECTURE.md); this file is the plan.
Updated after every stage.

## Goal

A minimal, clean Shopify theme for the BioHarmony store, written from scratch in one style:
easy to manage in the theme editor, correct for SEO, and ready for a future Next.js storefront
(shared tokens, CSS and `@ui/*` JS in `packages/`).

## Done

### Foundation
- Tokens → CSS (`packages/tokens`), shared UI package synced into `theme/assets/ui-*`.
- Studio style: Bricolage Grotesque + DM Sans, green accent, 5 color schemes
  (Studio, Sage, Forest, Sand, Holiday — warm light with a deep red accent for seasonal promos).
- Typography system in the shadcn proportions, one set of components (button, chip, link list,
  product card, slider, drawer, price).
- SEO base: structured data, meta tags, one `h1` per page, `noindex` on search.
- Playwright screenshot tool: `npm run shoot <scenario>`.

### Header
- Three layouts, sticky (always / on scroll up), transparent over the first section.
- Desktop menu: dropdowns and mega menu (links, promo card, product slider); title is a link,
  the chevron opens the panel.
- Mobile menu under the header with drill-down levels.
- Settings panel: account, wishlist, compare, currency and language.
- Search panel: popular searches, quick links, collections, best sellers; typed results with
  suggestions, collections, pages and products.
- Announcement strips, each its own section, above or below the header:
  **Announcement bar** (rotating messages), **Marquee** (running line), **Countdown bar**
  (promo with a timer). All have a schedule ("show from / until").

### Footer
- Columns as blocks: brand (logo, text, social), menus, contacts, products (compact rows),
  blog posts; accordions on phones; bottom row with copyright, policy links, payment icons.
- Theme settings > Store details: contacts and social profiles, one source for the footer and
  the Organization structured data (telephone, email, address, sameAs).

### Promo
- Promo card (one component, stacked or text over the image): mega menu now, banner grids later.
- Section group "Overlays" with the Promo popup: content blocks (text, countdown, newsletter,
  products, button), triggers (delay, scroll, exit intent), "don't show again for N days", pages,
  schedule; a sheet from the bottom on phones. Christmas example.
- Newsletter: form in the popup and a Newsletter section (footer), through project-server;
  plain Shopify form without the API or JS.

### Cart
- Cart drawer: compact lines, free-shipping progress under the title, promo codes, order details
  (note + attributes), total inside the checkout button.
- "You may also like" (manual list) as product cards in a slider, drawer and cart page.
- Recommendations panel next to the drawer (Shopify related products, up to 10, vertical slider).

### Server
- `project-server`: newsletter sign-up API (Shopify customers + marketing consent), reCAPTCHA v3,
  origin allowlist, rate limit. The old custom checkout is in git history.

## Next

1. **Home page sections**: hero / page banner, product list, collection list, content
   (text + image), on theme blocks so they are assembled in the editor.
2. **Product page** on blocks: gallery, variants, buy buttons, complementary products.
3. **Collection page**: filters and sorting.
4. **Content pages**: contact, FAQ (metaobjects), testimonials, newsletter, trust bar.
5. **Wishlist and compare** (kept from the old theme's feature list).
6. **Spin-to-win** popup (server picks the prize and can issue a personal code), popup teaser tab.

## Decisions

| Decision | Why |
|---|---|
| Own minimal CSS/JS, shadcn proportions, no UI frameworks | Speed and easy maintenance; frameworks bring more than we use |
| One component per pattern | The same card, list, slider and drawer everywhere; fewer styles to keep in sync |
| The old theme is only a list of features, never a code source | Its code is heavy; every section here is written from scratch |
| Liquid Ajax Cart for the cart | Cart markup stays in Liquid and re-renders itself; no client-side templates |
| Overlays close through JS (`[data-closing]`), not CSS exit transitions | CSS exit transitions of dialogs and popovers don't play in every browser |
| Panels are `popover="manual"` | Their closing (outside click, Esc) can then be animated too |
| Announcement strips are three small sections, not one with block types | Each does one job, and each can sit above or below the header |
| Dates in settings as text `2026-12-24 23:59` | Shopify has no date-time picker; one field is clearer than day/month/year selects |
| Newsletter through our own small API, not the Shopify customer form | The form posts with a page reload and can hit Shopify's bot check; the API answers JSON, and later can issue a personal discount code |
| Recommendations: related products from Shopify, no app | Works on every plan; Search & Discovery can add "complementary" later |
