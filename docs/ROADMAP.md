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

### Home page
- Sections: Hero (slides, video, "Image banner" preset), Trust bar, Product list (slider or grid,
  "Show more" on phones, deal of the week with countdown), Promo grid, Collection list (skips empty
  and `theme.hidden` collections), Image with text, Blog posts, Brands, FAQ (FAQPage data), Rich
  text (SEO text with "Read more"), Page header (breadcrumbs + h1).
- Checked at 390 / 768 / 1024 / 1366 px.

### Products
- Product card: "−X%" / Sale / Sold out badges, color swatches or a one-line value list, one
  overlay link, "Add to cart" → "− 2 in cart +", "✓ In cart" for products with options.
- Quick view with linked options (missing / sold-out combinations, closest variant), variant
  images, in-cart marks; loads its JS on first use.
- Wishlist and compare in the browser (`@ui/saved-list`), toasts with View / Undo, wishlist page
  (cards) and compare page (table), skeleton loading and empty states.
- Cart: sale prices and "−X%" on lines, swatches in options, savings include sale prices.

### Collection & product (2026-10-26)
- Collection page: filters (Search & Discovery) as sidebar, dropdowns or drawer — counts, swatches,
  price slider, active chips — live updates through the Section Rendering API with history; sort,
  density toggle, promo tile, Load more; subcollection chips, collection image, SEO text and FAQ;
  filtered lists noindex.
- Collections page: Editorial list (default), Bento mosaic, Grid.
- Product page: gallery grid / thumbnails / stacked (slider on phones), zoom lightbox, info blocks
  (vendor, title, rating, price, linked variant picker, buy buttons with quantity + dynamic
  checkout + stock + in-cart note, delivery estimate, highlights, collapsible rows from description /
  metafield / page, complementary products, share), sticky buy bar, related products (lazy),
  recently viewed, FAQ.
- Pages rebuilt: page, contact, 404, blog (topics, featured), article (comments, share).

### Quality pass (2026-10-26)
- Lighthouse audit: off-screen CSS no longer blocks render, lazy variant picker, reduced variant
  JSON, alt texts, one canonical, store description as meta fallback, AA contrast for secondary
  text, 24 px tap targets.
- Refactor: text / radius / icon / control tokens, one arrow-nudge rule, `option-is-color` and
  `discount-percent` helpers, Prettier + editorconfig, unused locale keys removed.
- [STYLEGUIDE.md](STYLEGUIDE.md): checklist and pitfalls.

## Next

0. **Go live**: publish the theme; project-server on a public https host (its URL in Theme settings >
   Integrations > API URL, the store domain in ALLOWED_ORIGINS, THEME_SECRET = the theme's API
   secret); then Lighthouse / PageSpeed Insights on the CDN. Measured in theme dev, our own JS is
   ~0.3 s of main thread; Shopify's perf-kit / analytics are the rest.
1. **Store reviews page** (`page.reviews`, `/pages/reviews`): Judge.me's product widget renders
   nothing outside a product; the page needs Judge.me's all-reviews widget (enabled in the Judge.me
   admin first), then styling like the product widget.
2. **Notifications** for new contact / back-in-stock requests: Shopify Flow on the customer tags
   (set up in the admin — there is no API to create workflows).
3. **Spin to win, next step**: the prize is picked on the server once per email (done); a personal
   one-time code per email (needs the discounts scope), a teaser tab to reopen the popup.
4. Wishlist / compare synced to the customer account through project-server.
5. The store's own texts in the admin: home meta title / description (Online Store → Preferences),
   the logo.

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
| Wishlist and compare live in the browser, pages render through the Section Rendering API | No app and no account needed; cards stay Liquid, the same as everywhere else |
| No persistent compare bar; toasts + a link in the utility menu | A fixed bar covered content and the footer and looked heavy |
| Off-screen CSS loads without blocking render | First paint needs only what is visible; layers keep the cascade stable |
| Secondary text through one token at 80% | 72% and lower failed AA contrast on 12–14 px text |
| No legacy account pages in the theme (customers/* templates removed) | The store uses Shopify's new customer accounts (hosted by Shopify, legacy ones are being retired); the header's account link goes there through `routes.account_url` |
| Contact form and back-in-stock requests through project-server, kept on the customer (note + tag) | No email service to send from; the admin shows them under Customers, Flow / Shopify Email can notify |
