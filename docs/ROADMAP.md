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
  (Studio, Sage, Forest, Sand, Pumpkin — a dark one with an orange accent for promos).
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

### Cart
- Cart drawer: compact lines, free-shipping progress under the title, promo codes, order details
  (note + attributes), total inside the checkout button.
- "You may also like" (manual list) as product cards in a slider, drawer and cart page.
- Recommendations panel next to the drawer (Shopify related products, up to 10, vertical slider).

## Next

1. **Home page sections**: hero / page banner, product list, collection list, content
   (text + image), on theme blocks so they are assembled in the editor.
2. **Product page** on blocks: gallery, variants, buy buttons, complementary products.
3. **Collection page**: filters and sorting.
4. **Content pages**: contact, FAQ (metaobjects), testimonials, newsletter, trust bar.
5. **Wishlist and compare** (kept from the old theme's feature list).

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
| Dates in settings as text `2026-10-31 23:59` | Shopify has no date-time picker; one field is clearer than day/month/year selects |
| Recommendations: related products from Shopify, no app | Works on every plan; Search & Discovery can add "complementary" later |
