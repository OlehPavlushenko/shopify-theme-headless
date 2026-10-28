# Storefront (headless)

Next.js (App Router) on the Shopify Storefront API. Shares the design tokens, CSS and JS with the theme:
`packages/ui/css` is imported as `@ui-css/*`, `packages/ui/js` as `@ui/*` (jsconfig.json), so a component
that outputs the theme's markup and classes gets the theme's styles.

## Setup

1. Admin > Sales channels > **Headless** > Create storefront > Storefront API: copy the public access token.
2. `cp .env.example .env.local` and fill in the store domain and the token.
3. From the repository root: `npm run storefront:install`, then `npm run storefront` (http://localhost:3000).

Without the token the pages render with empty states.

## Layout

| Path | What it is |
|---|---|
| `app/` | Routes (server components); `layout.js` loads the shared CSS, the fonts, header and footer |
| `components/` | One component per theme snippet / section, same markup and classes (`ProductCard` = `snippets/product-card.liquid`) |
| `lib/shopify.js` | Storefront API client (server only), `localPath`, `formatMoney` |
| `lib/queries.js` | GraphQL fragments (one per component) and loaders |
| `lib/image-loader.js` | `next/image` through Shopify's CDN resizing |

## Status

Stage 1: frame (header, footer), home page with best sellers. Next: product and collection pages, the
cart (Cart API) and checkout, search, SEO (metadata, JSON-LD, sitemap), content from metaobjects.
