# Loyalty storefront

Shopify theme for `education-checkout-extensibility.myshopify.com`, built as a headless-ready
monorepo. Conventions and structure: [ARCHITECTURE.md](ARCHITECTURE.md).

## Requirements

- Node.js 22.12+
- Shopify CLI 4.x (`npm install -g @shopify/cli@latest`)

## Getting started

```bash
npm run dev      # syncs packages/ui into the theme and starts `shopify theme dev` on theme/
npm run watch    # in a second terminal while editing packages/ui
npm run check    # theme check
```

Open http://127.0.0.1:9292. The theme editor link is printed by `shopify theme dev`.

## Folders

| Path | What it is |
|---|---|
| `theme/` | The Shopify theme being built |
| `packages/tokens/` | Design tokens (single source of defaults) |
| `packages/ui/` | Shared CSS and JS used by the theme and a future headless storefront |
| `reference/loyalty-theme/` | Previous theme, kept for reference |
| `scripts/` | Build helpers |

## Status

Stage 1 — skeleton: layout, tokens, color schemes, header with mobile menu, footer, cart drawer
and cart page (Liquid Ajax Cart v2.2.0). Product, collection and content sections are Shopify
Skeleton v1 placeholders and are rebuilt stage by stage.

`theme/` is based on [Shopify Skeleton Theme](https://github.com/Shopify/skeleton-theme) v1.0.0 (MIT,
see `theme/LICENSE.md`).
