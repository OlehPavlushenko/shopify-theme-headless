# Style guide

How to write a new section, snippet, style or script so that it looks and behaves like the rest of
the theme. [ARCHITECTURE.md](../ARCHITECTURE.md) explains the structure; this file is the checklist
and the list of mistakes we already made once. Read both before adding code.

## Before you start

- **Look for the component first.** One pattern = one component. Product card, price, swatch,
  variant picker, slider, drawer / popup, accordion, toast, skeleton, section head, page header,
  promo card (`.grid-promo` in a grid), `.btn` variants, `.pill` (statuses: `--soft`, `--success`,
  `--danger`), `.chip` (selected: `aria-pressed` / `aria-checked` / `aria-current`; `--compact` for
  removable filters), `.tag` (topics), `.empty-state`, `.card` (a surface box; `--card-padding`),
  `.icon-circle` (`--icon-circle-size`, `--icon-circle-bg`), `.frame` (`--cover`: fills its positioned
  parent), `.scroll-track` (a sideways snap list without a scrollbar; item width `--track-item`;
  `.scrollbar-hidden` for other scrolling rows), `.sticky-column` (+ `--scroll`, `--wide`: a column that
  stays under the header), `.drawer` (`--top`, `--start`), `.form-errors`, `.notice` (`--success`: a form's success line), `.search-form` (a field with its button), `.search-field` (icon inside a field), `.load-more` cell. Extend one
  with a parameter or modifier instead of writing a look-alike.
- **Shared behavior already exists:** `<load-more>` (paginated grids), `<section-swap>` (links and
  GET forms that re-render a section, also from another template), `<form-validate>` (field checks with messages under the fields, messages
  from `snippets/form-validate-messages`), `<contact-form>` (a form sent as JSON to project-server: contact, back in stock), `@ui/scroll` (offset below the header, reduced motion),
  `@ui/delivery` (delivery dates). Sticky things below the header use `--sticky-top`, `--sticky-max-height` and
  `--sticky-transition` (header.css).
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
  are `breadcrumbs`, the options of every search form and link are `search-options`, the API URL is `api-url`, the tab title is `document-title`. Don't copy their logic.
- Shared markup snippets — use them instead of writing the markup again:
  - `close-button` (`class`, `label`, `popover`): the × of a drawer, popup or popover;
    `dialog-header` (`title`, `title_id`, `tag`, `title_class`, `class`, `close_class`, `popover`,
    `actions`, `content`): the title row of a drawer / popup with its close button;
  - `form-success` (`text`, `autofocus`): a form's success line;
    `contact-form` (`api`, `path`, `action`, `fields`, `intro`, `reopen`, …): a form sent to project-server
    or, without the API URL, Shopify's contact form, with `<form-validate>` and its success template
    (contact page, "Ask a question", back in stock); `contact-fields` (`id_prefix`, …) are its fields;
  - `lazy-section` (`section_id`, `key`, `class`, `heading`, `link`, `prefetch`): the placeholder of hidden
    UI fetched when first shown (`@ui/lazy-section`); the section rendered on its own (`section.index`
    blank) outputs the full element with `data-lazy-key`;
  - `search-form` (`id`, `value`, `placeholder`, `label`, `scope`, `class`, `wrap_class`,
    `section_form`, `autocomplete`, `autofocus`, `panel`): every store search field with its
    `<form-validate>`;
  - `section-intro` (`eyebrow`, `heading`, `heading_class`, `heading_id`, `text`, `text_class`,
    `button_label`, `button_link`, `button_class`, `class`): a section's eyebrow / heading / text / button;
    `section-head` (`heading`, `heading_tag`, `heading_class`, `id`, `link_label`, `link`, `nav`):
    the heading row with a "view all" link or slider arrows;
  - `chip-remove` (`url`, `label`, `aria_label`, `link_attr`): a removable chip (active filters, topics);
  - `price` with `live: true`: a price the variant picker updates (`data-product-price`, `[data-compare-value]`).
- Schema labels shared by several sections live under `labels.*` in `en.default.schema.json`
  (`eyebrow`, `columns`, `limit`, `ratio*`, `link_label`, `collection`, `blog`, `products`, `image`, …);
  don't point a section at another section's key.

## CSS

- Tokens only. If a value repeats, it becomes a token in `packages/tokens/tokens.json` (and, for
  colors, in `snippets/color-schemes.liquid` too). Current helpers:
  - text: `--color-text-muted` (secondary text, AA contrast), `--color-text-disabled` (sold out,
    struck through, disabled — not for readable text);
  - shape: `--radius-full`, `--radius-card`, `--radius-media`, `--radius-button`, `--radius-badge`;
  - size: `--control-height-xs|sm|…|lg` (xs: compact chips and topic tags), `--control-toggle`, `--icon-sm`, `--underline-offset`.
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
- Component lifecycle: handlers are class fields (`#onClick = (event) => {…}`); every listener added
  in `connectedCallback` (on the element, its parts, an ancestor, `document` or `window`) takes
  `{ signal }` from an `AbortController` made there (`#abort`) and aborted in `disconnectedCallback`,
  which also clears timers, observers and requests. State lives in private `#fields`, not in public
  fields or expandos on other elements (a `WeakMap` for those).
- State on `<html>` / `<body>` comes from JS attributes, not `:has()` over the whole page:
  `html[data-scroll-lock]` (@ui/dialog: a modal dialog or a side panel is open), `html[data-menu-open]`
  (@ui/header: the mobile menu), `body[data-sticky-buy]` (product.js: the sticky add-to-cart bar shows).
- Shared helpers instead of copies: `@ui/fetch-html` (`sectionUrl`, `fetchHTML` with an optional
  cache, `importChildren`, `latest()` — only the newest request renders), `@ui/storage` (local /
  session storage that never throws), `@ui/api` (`postJSON` to project-server with reCAPTCHA v3),
  `@ui/clipboard` (`copyText`, `flashLabel`), `@ui/scroll` (`reducedMotion()`, `scrollBehavior()` —
  never a hard-coded `'smooth'` or another `matchMedia('(prefers-reduced-motion…)')`), `variantTitle`
  from `@ui/variant-picker`. A new `@ui/*` module gets its line in `snippets/import-map`.
- Layout reads before writes: in a frame or update, measure everything first, then change the DOM.
- Inline JSON only with the fields the script reads (the variant picker gets 6 fields, not the
  full variant objects).
- Prettier formats: `npm run format`.

## Pitfalls we already hit

| Mistake | Instead |
|---|---|
| `alt: image.alt \| default: ''` inside `image_tag` arguments — the filter applies to the **whole tag**, the alt stays missing | `assign image_alt = image.alt \| default: ''` before, then `alt: image_alt` |
| A filter at the end of an `append` chain (`… \| append: tag \| handleize`, `… \| append: terms \| url_encode`, `t: date: d \| time_tag`) — it runs on the **whole** string built so far | Filter the piece first (`assign one = tag \| handleize`), then append it |
| A global regex (`/…/g`) used with `test()` in a loop — `lastIndex` carries over and later matches are skipped | A separate non-global regex for `test()` |
| Fetch-and-swap code where only uncached requests are aborted — a slow older answer renders over the newer choice | A request counter: drop any answer that isn't the latest |
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
| A size container (`container-type: inline-size`) on a card in a product list — about 3 s of layout on the home page load at 4× CPU throttling | Media queries for where the box is wide (the deal card) |
| A new always-loaded stylesheet as its own `stylesheet_tag` — Shopify sends 10 preload Link headers at most, render-blocking styles first, and the page's `image_tag … preload: true` is dropped | Add it to `CORE` in `scripts/sync-ui.mjs` (joined into `ui-core.css`) |
| The page's main image `loading: 'lazy'` (the blog's featured article was) | `loading: 'eager', fetchpriority: 'high', preload: true` for the one main image of the page |
| Judging mobile Lighthouse scores from theme dev — it serves HTML and CSS uncompressed (270 KB / 170 KB) through a proxy | Compare before / after there; absolute numbers only on the CDN (the store unlocked) |

## Verifying

- `npm run lint` — Prettier check + `shopify theme check`.
- Screenshots: `npm run shoot <scenario>` (Playwright) at desktop and mobile; for responsive work
  also 768 and 1024.
- Lighthouse against `theme dev` measures the local proxy (no compression, no CDN cache, slow first
  byte): use it to compare before/after and to read the audits (render-blocking, alt, contrast, tap
  targets), not as the real score. Real numbers come from the published theme.
