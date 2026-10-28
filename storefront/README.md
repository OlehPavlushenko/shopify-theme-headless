# Storefront (headless)

Next.js (App Router) on the Shopify Storefront API. Shares the design tokens, CSS and JS with the theme:
`packages/ui/css` is imported as `@ui-css/*`, `packages/ui/js` as `@ui/*` (jsconfig.json), so a component
that outputs the theme's markup and classes gets the theme's styles.

## Setup

1. Admin > Sales channels > **Headless** > Create storefront > Storefront API: copy the public access token.
2. `cp .env.example .env.local` and fill in the store domain and the token; `SITE_URL` is the public
   address (canonical URLs, structured data, sitemap).
3. From the repository root: `npm run storefront:install`, then `npm run storefront` (http://localhost:3000).

`SHOPIFY_STORE_DOMAIN=mock.shop` (no token) runs on Shopify's public demo catalog — for development
before the store is connected. Without a store the pages render with empty states.

## Layout

| Path | What it is |
|---|---|
| `app/` | Routes (server components); `layout.js` loads the shared CSS, the fonts, header and footer |
| `components/` | One component per theme snippet / section, same markup and classes (`ProductCard` = `snippets/product-card.liquid`) |
| `lib/shopify.js` | Storefront API client (server only), `localPath`, `formatMoney` |
| `lib/queries.js` | GraphQL fragments (one per component) and loaders |
| `lib/image-loader.js` | `next/image` through Shopify's CDN resizing |

## How it works

- Pages are server components; the shared web components (`<site-header>`, `<drill-menu>`, `@ui/dialog`)
  load after hydration (`components/UiScripts.js`) and enhance the same markup as in the theme.
- Static where possible: the home and collections pages are prerendered and refreshed every 5 minutes;
  product, collection (sort, cursor), search and cart pages render per request (the API answers are
  cached by Next, the cart never).
- Cart: server actions in `app/actions.js` (they work without JS). The cart id is an httpOnly cookie, the
  item count a readable one: the header's count reads it in the browser, so pages don't need cookies.
- Variant picker: links (`?Size=M&Color=Red`), so every variant has a URL and no JS is needed.
- SEO: metadata and canonicals per page, Product and BreadcrumbList data, `sitemap.xml`, `robots.txt`
  (cart and search disallowed, search also `noindex`), one `h1` per page.

## Status

Done: header (sticky, mobile menu), footer, home (best sellers), product, collection (sort, next page),
collections list, search, cart with Shopify checkout, 404, sitemap, robots.
Next: desktop dropdowns / mega menu, search panel with suggestions (predictive search), filters
(Search & Discovery on the real store), home sections and promos from metaobjects, deploy on Vercel.
