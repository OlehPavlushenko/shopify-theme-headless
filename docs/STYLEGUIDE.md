# Style guide

How to write a new section, snippet, style or script so that it looks and behaves like the rest of
the theme. [ARCHITECTURE.md](../ARCHITECTURE.md) explains the structure; this file is the checklist
and the list of mistakes we already made once. Read both before adding code.

## Before you start

- **Look for the component first.** One pattern = one component. Product card, price, swatch,
  variant picker, slider, drawer / popup, accordion, toast, skeleton, section head, page header,
  promo card, `.btn` variants, `.pill`, `.chip`. Extend one with a parameter or modifier instead of
  writing a look-alike.
- **Data lives in Shopify.** Content a headless storefront would also need goes into metafields,
  metaobjects or Shopify settings, not into theme settings or code (example: "Hide from collection
  lists" is the collection metafield `theme.hidden`).
- **The theme is a generic prototype.** The current catalog is test data. Don't drop a feature
  because it doesn't fit cosmetics; don't hard-code product types, vendors or handles.

## Checklist for a new section

1. Name: `main-<template>` for template sections, a descriptive name otherwise.
2. Schema: `color_scheme` setting, `t:` keys for every label and option, `presets`, and where it
   may be added (`"disabled_on": { "groups": ["*"] }` for page sections, `enabled_on` for groups).
3. Comment at the top: what it shows, what JS and CSS it uses.
4. Wrapper: `<div class="<name> color-{{ section.settings.color_scheme }} section-spacing">` +
   `.page-width` inside. Two sections in a row on the same scheme collapse their double padding
   automatically.
5. Headings: one `h1` per page (the template's main section or **Page header**); sections use `h2`,
   cards `h3`. Change the look with `.h1`–`.h6`, never by picking another level.
6. Images: `image_url` + `image_tag` with `sizes` and `widths`; the first image of the first section
   loads eagerly with `fetchpriority: 'high'`, everything else lazily. Alt text is resolved
   **before** the tag (see pitfalls).
7. Styles go to the matching file in `packages/ui/css`, then `npm run sync`.
8. Check in the browser at **390, 768, 1024 and 1366 px**: no horizontal scroll, nothing cut off,
   equal card heights, hover only with a mouse.
9. `npm run lint` (Prettier + theme check) passes.

## Snippets

- Start with `{% doc %}` listing every `@param` (named like the props of the matching headless
  component). Leaf snippets take plain values where practical.
- A snippet that "returns" a value prints it; callers capture it. **The output starts with a
  newline** (the doc block's line end), so compare with `contains` or `strip` first:
  ```liquid
  {%- capture is_color -%}{% render 'option-is-color', option: option %}{%- endcapture -%}
  {%- if is_color contains 'true' -%} … {%- endif -%}
  {%- capture discount -%}{% render 'discount-percent', price: p, compare_at: c %}{%- endcapture -%}
  {%- assign discount = discount | strip | plus: 0 -%}
  ```
- One rule, one place: color-option detection is `option-is-color`, discount math is
  `discount-percent` (JS: `discountPercent` in `@ui/money`), color dots are `swatch`, breadcrumbs
  are `breadcrumbs`. Don't copy their logic.

## CSS

- Tokens only. If a value repeats, it becomes a token in `packages/tokens/tokens.json` (and, for
  colors, in `snippets/color-schemes.liquid` too). Current helpers:
  - text: `--color-text-muted` (secondary text, AA contrast), `--color-text-disabled` (sold out,
    struck through, disabled — not for readable text);
  - shape: `--radius-full`, `--radius-card`, `--radius-media`, `--radius-button`, `--radius-badge`;
  - size: `--control-height-sm|…|lg`, `--control-toggle`, `--icon-sm`, `--underline-offset`.
- **Colors derived from scheme colors are defined per scheme**, in `color-schemes.liquid`. A custom
  property with `var()` set on `:root` is resolved once and inherited as is — dark sections would
  get the light scheme's value.
- Color scheme classes are unlayered and beat `@layer components`: to recolor locally, set custom
  properties on an **inner** element.
- The same goes for Shopify's own CSS (dynamic checkout, apps): it is unlayered, so a theme override
  of it must be unlayered too (see the end of `product.css`), scoped to our component.
- BEM, mobile first (750 / 990 px), 2-space indent, property order as in ARCHITECTURE.md.
- When the layout depends on the space a component gets (a card in a column vs a full row), use a
  **container query**, not a viewport breakpoint (see the deal card).
- Hover effects inside `@media (hover: hover)`, so a tap on a phone doesn't leave them stuck.
- Arrow-right icons nudge on hover through **one** global rule (`components.css`) — don't add
  per-component copies.
- A horizontally scrolling element clips vertically too: give it a little block padding (as
  `.slider__track` does) so borders and focus rings at its edges aren't cut.
- Tap targets are at least 24 px (slider dots draw an 8 px dot inside a 24 px button).
- Styles of things that are off screen at first paint (cart drawer, search panel, popups, footer)
  load without blocking render (`theme.liquid`); a new file of that kind joins that list.

## JS

- Shared behavior is a web component or a pure module in `packages/ui/js` (`@ui/<name>`); Shopify
  plumbing (cart API, Section Rendering API) is a thin adapter in `theme/assets`.
- Load a module where it is used: `<script type="module">import '@ui/x';</script>` in the section,
  or `import()` on first use (quick view loads the variant picker on the first open). Only what
  every page needs is imported in `theme.liquid`.
- Don't read layout (`clientWidth`, `getBoundingClientRect`) at module load or in
  `connectedCallback`: it forces a reflow while the page renders. A component that already has a
  `ResizeObserver` gets its first measurement from the observer's first call (after layout, before
  paint) — don't also call the update by hand. Otherwise measure right before you need it.
- Overlays open and close through `@ui/dialog`; open styles go on `[open]:not([data-closing])` /
  `:popover-open:not([data-closing])`.
- Server-render first: the HTML works without JS (forms post, links navigate); JS enhances.
- Inline JSON only with the fields the script reads (the variant picker gets 6 fields, not the
  full variant objects).
- Prettier formats: `npm run format`.

## Pitfalls we already hit

| Mistake | Instead |
|---|---|
| `alt: image.alt \| default: ''` inside `image_tag` arguments — the filter applies to the **whole tag**, the alt stays missing | `assign image_alt = image.alt \| default: ''` before, then `alt: image_alt` |
| `a and b or c and d` in a Liquid condition — Liquid evaluates right to left | Split into separate `if`s or `assign` flags |
| `reject` / `where` on an array of strings | They work on arrays of objects; loop instead |
| `== 'true'` on a captured snippet output | `contains 'true'` (leading newline) |
| `sed -i`, `*.new`, any temp file inside `theme/` while `theme dev` runs — it uploads it and serves a sticky "Failed to Upload" 500 until restarted | Edit files in place; temp files in the scratchpad |
| Writing `settings_data` / group JSON before the schema it uses is uploaded — "not supported in section groups", silently reverted | Schema first, wait for the upload, then data |
| Hex stops in color scheme gradients — the editor sync reverts `settings_data` | `rgba()` stops |
| Exit animations with CSS `overlay` / `display allow-discrete` | JS-driven `[data-closing]` (works in every browser) |
| Hiding something with the `hidden` attribute when a class sets `display` | State attributes (`data-state`) + CSS that decides |
| A number that means different things in two places ("3 in cart" on the card vs "2 in cart" for the variant) | Show a number only where it is unambiguous ("✓ In cart" on the card) |
| A fixed bar at the bottom covering the footer | Avoid persistent overlays; if needed, reserve space at the end of the page |
| Copying colors or gradients from a reference | References are for ideas; use the theme's schemes and tokens |
| A custom element (`<facet-filters>`, `<product-info>`…) used as a section wrapper — it is inline by default, so `section-spacing` padding doesn't apply | Give every wrapping custom element `display: block` (or grid) |
| Writing Liquid through a shell one-liner (`node -e '…'`) — single quotes inside get eaten (`== 'search'` became `== search`, silently false) | Edit files with the editor tools; scripts that write code go in a file |
| A one-line scrolling row (chips, tabs) inside a grid with an `auto` column — the column grows to the row's full width and the page scrolls sideways (page header subcollections, FAQ topics) | `grid-template-columns: minmax(0, 1fr)` on that grid |
| `display: contents` on a wrapper so a child can be sticky over a longer sibling — the grid gets new items with its own (larger) gap | Set the grid's gap for that case too |
| "Failed to resolve module specifier @ui/…" on every module | The page loaded while theme dev was uploading — reload once edits settle |

## Verifying

- `npm run lint` — Prettier check + `shopify theme check`.
- Screenshots: `npm run shoot <scenario>` (Playwright) at desktop and mobile; for responsive work
  also 768 and 1024.
- Lighthouse against `theme dev` measures the local proxy (no compression, no CDN cache, slow first
  byte): use it to compare before/after and to read the audits (render-blocking, alt, contrast, tap
  targets), not as the real score. Real numbers come from the published theme.
