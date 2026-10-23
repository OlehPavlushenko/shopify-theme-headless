# Architecture

The Shopify theme is built step by step on a small, documented skeleton. Everything that is not
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
   act as a fallback.
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
   (import map in the theme; a path alias in Next.js). Shopify-only integrations (Liquid Ajax Cart,
   Section Rendering API) are thin adapters in `theme/assets` (e.g. `cart.js`).

## CSS

- Cascade layers, declared once in `tokens.css` (loaded first):
  `reset, base, layout, components, utilities`. Every rule lives in a layer; Liquid-generated
  overrides (`theme-tokens`, `color-schemes`) are unlayered on purpose so they win.
- Style direction: **Studio** (Bricolage Grotesque headings, DM Sans body, pill buttons, 20px cards,
  green accent). Defaults live in `tokens.json` and in the theme's settings schema/data.
- Token scales: `--text-xs … --text-4xl` (fluid from `xl` up), `--leading-*`, `--space-2xs … --space-4xl`,
  `--radius-*`, `--shadow-sm|md|overlay`, `--duration-*`, `--ease`, `--ease-out`, `--control-height*`.
  No raw sizes or colors in components when a token exists.
- Files:
  - `base.css`: reset, element defaults, typography, `.rte`, layout primitives (`.page-width`, `.stack`,
    `.cluster`, `.grid`, `.section-spacing`) and utilities.
  - `components.css`: `.btn` (+ `--secondary|outline|link|icon|sm|full`), `.field`/`.input`, `.qty`,
    `.price-tag`, `.pill`, `.frame`, `.svg-icon`, `.form-error`, `.drawer`, `.popup`.
  - One file per area: `header.css`, `footer.css`, `cart.css`, `blocks.css`, `pages.css`
    (baseline template sections; shrinks as pages are rebuilt).
- Formatting: 2-space indent; rule order base → elements → modifiers → states → responsive;
  property order layout/position → box model → typography → visual → motion; mobile first
  (breakpoints 750px, 990px).
- No `{% stylesheet %}` / `{% javascript %}` and no inline `<style>` with static CSS in the theme.
  Per-instance values go through custom properties in a `style=""` attribute.
- Color schemes: a container opts in with `class="color-<scheme-id>"`; `base.css` applies its
  background and text color. Scheme custom properties: `--color-background`, `--color-foreground`,
  `--color-heading`, `--color-link-hover`, `--color-accent`, `--color-accent-2`, `--color-surface`,
  `--color-border`, `--color-button*`, `--color-input-*`.

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

## JS

- Native `<dialog>` for every drawer and modal (`@ui/dialog`):
  `[data-dialog-open="<id>"]` opens, `[data-dialog-close]` closes, backdrop click and Esc close.
- Cart: Liquid Ajax Cart v2 re-renders `[data-ajax-cart-section]` after every cart request, so cart
  markup and totals stay in Liquid. `theme/assets/cart.js` only handles "after adding to cart".
- No third-party runtime dependencies other than Liquid Ajax Cart.

## Workflow

```bash
npm run dev        # tokens + sync, then shopify theme dev on theme/ (with theme editor sync)
npm run watch      # re-sync packages/ui into theme/assets on every change (second terminal)
npm run check      # shopify theme check on theme/
npm run dev:reference   # run the previous theme for comparison
```

Never edit `theme/assets/ui-*` directly: they are generated from `packages/ui`.
