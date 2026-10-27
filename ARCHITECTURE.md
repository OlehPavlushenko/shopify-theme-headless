# Architecture

The Shopify theme is built step by step on a small, documented skeleton. The day-to-day rules
and the list of pitfalls are in [docs/STYLEGUIDE.md](docs/STYLEGUIDE.md); the plan is in
[docs/ROADMAP.md](docs/ROADMAP.md).

 Everything that is not
Shopify-specific lives in framework-agnostic packages, so a future headless storefront (Next.js)
reuses the same design tokens, CSS and JS.

## Repository layout

```
packages/
  tokens/            tokens.json — the single source of default design values
                     build.mjs   — tokens.json -> packages/ui/css/tokens.css
  ui/
    css/             framework-agnostic CSS (base + one file per component area)
    js/              framework-agnostic ES modules (imported as @ui/<name>)
theme/               the Shopify theme (Online Store 2.0: sections, JSON templates, theme blocks)
reference/
  loyalty-theme/     the previous theme, kept as a working reference for behavior and features
scripts/
  sync-ui.mjs        copies packages/ui/{css,js}/<file> -> theme/assets/ui-<file>
```

## Principles

1. **Data lives in Shopify, not in the theme.** Content and business rules that a headless
   storefront also needs go into metafields, metaobjects, Search & Discovery or Shopify Functions:
   FAQ, testimonials, size charts, badges, upsells, bundles, the free-shipping threshold
   (`shop.metafields.custom.free_shipping_threshold`). Theme settings only control presentation or
   act as a fallback. Metafields the theme reads: collection `theme.hidden`, `theme.featured`,
   `theme.subcollections`, `theme.seo_text`, `theme.seo_heading`; article `theme.products`
   ("Shop this article"); product `reviews.rating`, `reviews.rating_count` (review apps).
2. **One source of design tokens.** `packages/tokens/tokens.json` defines every token and its default.
   Names map 1:1 to CSS custom properties (`color.accent` -> `--color-accent`). The theme overrides
   them from Theme settings (`snippets/theme-tokens.liquid`, `snippets/color-schemes.liquid`); a
   headless storefront uses the defaults or its own overrides. Never introduce a token in only one place.
3. **CSS is framework-agnostic.** Plain CSS in `packages/ui/css`, BEM class names, tokens only,
   no Liquid. A React component that outputs the same classes gets the same styles.
4. **Components are contracts.** Every snippet and block starts with `{% doc %}` listing its params,
   named like the props of the matching headless component. Leaf components (price, media, badge,
   card) take plain values rather than whole Liquid objects where practical.
5. **JS: web components and pure modules.** Shared code is `packages/ui/js/*`, imported as `@ui/<name>`
   (import map in the theme — snippets/import-map, both layouts; a path alias in Next.js). Shopify-only integrations (Liquid Ajax Cart,
   Section Rendering API) are thin adapters in `theme/assets` (e.g. `cart.js`).

## CSS

- Cascade layers, declared once in `tokens.css` (loaded first):
  `reset, base, layout, components, utilities`. Every rule lives in a layer; Liquid-generated
  overrides (`theme-tokens`, `color-schemes`) are unlayered on purpose so they win.
- Style direction: **Studio** (Bricolage Grotesque headings, DM Sans body, pill buttons, 20px cards,
  green accent). Defaults live in `tokens.json` and in the theme's settings schema/data.
- Token scales: `--text-xs … --text-4xl` (fluid from `xl` up), `--leading-*`, `--space-2xs … --space-4xl`,
  `--radius-*`, `--shadow-sm|md|overlay`, `--backdrop-color`, `--drawer-width`, `--duration-*`, `--ease`,
  `--ease-out`, `--control-height*`.
  No raw sizes or colors in components when a token exists.
- Files:
  - `base.css`: reset, element defaults, typography, `.rte`, layout primitives (`.page-width`, `.stack`,
    `.cluster`, `.grid`, `.section-spacing`) and utilities.
  - `components.css`: `.btn` (+ `--secondary|outline|link|icon|sm|full`), `.field`/`.input`, `.qty`,
    `.price-tag`, `.pill`, `.chip`, `.swatch`, `.variant-picker`, `.accordion`, `.read-more`,
    `.skeleton`, `.breadcrumbs`, `.toast`, `.frame`, `.svg-icon` (+ the one arrow-nudge rule),
    `.form-error`, `.drawer`, `.popup`.
  - `product-card.css`: product card, compact product row, deal-of-the-week card, quick view.
  - `saved.css`: wishlist / compare toggles, counters, their pages and the compare table.
  - `slider.css`: the slider (`<ui-slider>`), 4 columns at most on tablets.
  - `sections.css`: content sections (hero, product list, collection list, promo grid, image with text,
    trust bar, blog posts, brands, FAQ, rich text, page header) and their shared heading row
    (`snippets/section-head`).
  - Color schemes are unlayered CSS (`snippets/color-schemes`), so they beat anything in `@layer components`:
    to change scheme colors locally, set the custom properties on an inner element, not on the element
    that carries the `color-scheme-*` class.
  - `promo.css`: promo card (`snippets/promo-card`, used everywhere promos are shown), newsletter form, promo popup.
  - Side panels are one component: `.drawer` > `.drawer__inner` > `__header` / `__body` / `__footer`,
    on a `<dialog>` (cart, search drawer) or a `[popover]` (utility panel); same width, motion and backdrop.
  - One file per area: `header.css`, `footer.css`, `cart.css`, `blocks.css`, `facets.css`
    (collection / search filters and grid), `product.css` (product page).
- Formatting: 2-space indent; rule order base → elements → modifiers → states → responsive;
  property order layout/position → box model → typography → visual → motion; mobile first
  (breakpoints 750px, 990px).
- Loading (`layout/theme.liquid`): tokens, base, components, product card, slider, announcements,
  header, sections block render; search, cart, promo and footer load without blocking (blocking
  on their own templates); `facets.css` on collection / search, `product.css` on products, `saved.css` only with
  wishlist / compare on. Layer order is set by `tokens.css`, so load order never changes the cascade.
- No `{% stylesheet %}` / `{% javascript %}` and no inline `<style>` with static CSS in the theme.
  Per-instance values go through custom properties in a `style=""` attribute.
- Color schemes: a container opts in with `class="color-<scheme-id>"`; `base.css` applies its
  background and text color. Scheme custom properties: `--color-background`, `--color-foreground`,
  `--color-heading`, `--color-link-hover`, `--color-accent`, `--color-accent-2`, `--color-surface`,
  `--color-border`, `--color-button*`, `--color-input-*`.

## Typography

Proportions follow shadcn/ui (Tailwind scale); no third-party CSS is used, only the scale.

| Token | Size / line height | Used for |
|---|---|---|
| `--text-xs` | 12 / 16 | badges, eyebrows, captions |
| `--text-sm` | 14 / 20 | UI text: buttons, labels, links, card title and price |
| `--text-md` | 16 / 24 | body, inputs (never smaller: iOS zooms on focus) |
| `--text-lg` | 18 / 28 | lead text, h5 |
| `--text-xl` | 20 / 28 | h4 |
| `--text-2xl` | 24 / 32 | h3 |
| `--text-3xl` → `--text-4xl` | 30 → 36 fluid | h2 |
| `--text-4xl` → `--text-5xl` | 36 → 48 fluid | h1 |

Weights: 400 body, 500 UI (buttons, labels, links), 600 emphasis (prices, badges, eyebrows, active
nav), heading weight from the heading font. Tracking: `--tracking-tight` on headings,
`--tracking-wide` on uppercase eyebrows only.

Roles in `base.css`: `h1`–`h6` / `.h1`–`.h6`, `.text-lead`, `.text-sm`, `.text-xs`, `.label`, `.eyebrow`.
Components never set raw font sizes or weights; they use these tokens or roles.

## Liquid

- Template sections are named `main-<template>` (`main-product`, `main-cart`); reusable sections and
  theme blocks have descriptive names.
- First setting of every section is `color_scheme`; spacing uses `padding_top` / `padding_bottom`
  (0–120 px, step 4).
- Every merchant-facing label uses a `t:` key (`locales/en.default.schema.json`); every storefront
  string uses `{{ 'key' | t }}` (`locales/en.default.json`).
- Storefront URLs only via `routes.*`, never hardcoded paths.
- Images via `image_url` + `image_tag` with explicit `sizes`; above-the-fold images load eagerly
  with `fetchpriority: 'high'`, everything else lazily.

## Where sections can be added

Every section that has presets says where it belongs, so each list in the theme editor only offers
its own sections:

| Place | Sections | Schema |
|---|---|---|
| Header group | header, announcement bar, countdown bar, marquee |
| Header or footer group | marquee | `"enabled_on": { "groups": ["header", "footer"] }` | `"enabled_on": { "groups": ["header"] }` |
| Footer group | footer, newsletter | `"enabled_on": { "groups": ["footer"] }` |
| Overlays group | promo popup | `"enabled_on": { "groups": ["custom.overlay"] }` |
| Page templates | everything else (home sections, custom section, …) | `"disabled_on": { "groups": ["*"] }` |

## SEO

Every new section and snippet follows these rules:

- **One `<h1>` per page**, owned by the template's main section (product title, collection title,
  page title, search heading). Section headings inside pages are `h2`; cards use `h3` (or a `p`
  inside overlays such as the search panel). Never skip levels for styling — use the `.h1`–`.h6`
  classes to change the look.
- **Semantic markup**: `header`, `nav` (with `aria-label`), `main`, `footer`, `section` with a
  labelled heading, lists (`ul[role=list]`) for grids of cards, real `<a href>` for navigation and
  `<button>` for actions.
- **Structured data** lives in `snippets/structured-data.liquid` (Organization everywhere,
  WebSite + SearchAction on the home page, Product and Article via Shopify's `structured_data`
  filter) and in the components that own the content: `snippets/breadcrumbs.liquid`
  (BreadcrumbList) and `sections/faq.liquid` (FAQPage, built from the same blocks it shows). Data
  that describes visible content is output next to it; site-wide data only in structured-data.
- **Meta**: `snippets/meta-tags.liquid` handles title, description, canonical, Open Graph and
  Twitter cards; the share image falls back to Theme settings → Brand → Social sharing image.
  Search results get `noindex, follow` (they duplicate catalogue content).
- **Images**: every content image has meaningful `alt` (from the media's alt text), decorative
  ones get `alt=""`; explicit `width`/`height` (via `image_tag`) to avoid layout shift; the LCP
  image loads eagerly with `fetchpriority: 'high'`, all others lazily.
- **Content stays server-rendered**: JS only enhances (drawers, predictive search). Anything a
  crawler should see (menus, product lists, prices) is in the initial HTML.
- **URLs** come from `routes.*` and Liquid objects (`product.url`, `collection.url`), which keep
  Markets subfolders (`/en-mx`) and language prefixes correct.
- **Performance is SEO**: no render-blocking JS, CSS split per area, fonts with `font-display: swap`
  and preloaded, Speculation Rules prefetch and View Transitions behind theme settings.

## JS

- Native `<dialog>` for every drawer and modal (`@ui/dialog`):
  `[data-dialog-open="<id>"]` opens, `[data-dialog-close]` closes, backdrop click and Esc close.
  Non-modal panels are `popover="manual"` opened by `popovertarget` buttons: utility panel, mobile menu
  under the header; `@ui/dialog` handles their buttons, outside click and Esc.
  Closing is animated by JS for both: `[data-closing]` is set, the leaving transition runs, then
  close()/hidePopover() — so open-state styles go on `[open]:not([data-closing])` /
  `:popover-open:not([data-closing])`. Don't rely on `overlay`/`display` exit transitions (not in every browser).
- Cart: Liquid Ajax Cart v2 re-renders `[data-ajax-cart-section]` after every cart request, so cart
  markup and totals stay in Liquid. `theme/assets/cart.js` only handles "after adding to cart".
- No third-party runtime dependencies other than Liquid Ajax Cart.

## Workflow

```bash
npm run dev        # tokens + sync, then shopify theme dev on theme/ (with theme editor sync)
npm run watch      # re-sync packages/ui into theme/assets on every change (second terminal)
npm run check      # shopify theme check on theme/
npm run format     # Prettier on the JS (2 spaces, single quotes, width 140; .prettierrc.json)
npm run lint       # format:check + check — run before every commit
npm run dev:reference   # run the previous theme for comparison
npm run shoot <scenario> [arg] <outDir>   # Playwright screenshots (desktop + mobile) of the dev store:
                   # home | menu <n> | mobile-menu [n] | utility | cart-drawer | search-empty | search <q> | cart | collection
```

Never edit `theme/assets/ui-*` directly: they are generated from `packages/ui`.
