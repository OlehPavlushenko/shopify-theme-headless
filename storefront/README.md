# Storefront (headless)

Next.js 16 (App Router, plain JS) on the Shopify Storefront API, built on the theme: it renders the theme's
JSON templates and section groups with the settings saved in the theme editor (`theme/config`,
`theme/templates`, `theme/sections`, `theme/locales`), one React component per section producing the
theme's markup and classes. CSS and web components are the theme's own, from `packages/ui`
(`@ui-css/*`, `@ui/*`), so the pages look and behave like the Liquid theme.

## Setup

1. Admin > Sales channels > **Headless** > Create storefront > Storefront API: copy the public access token.
2. `cp .env.example .env.local` and fill it in (see the comments there): the store domain and token, an
   Admin API token (`read_products`, `read_content`, `read_files`: reviews, tax settings, collection sort
   orders, page templates — optional, the pages fall back without it), `SITE_URL`, the store's time zone,
   `THEME_SECRET` (the theme's API secret, for the Spin to win wheel).
3. From the repository root: `npm run storefront:install`, then `npm run storefront` (http://localhost:3000).

`SHOPIFY_STORE_DOMAIN=mock.shop` (no token) runs on Shopify's public demo catalog.

## Layout

| Path | What it is |
|---|---|
| `app/(site)/` | Pages: home, product, collection (+ type / vendor), collections list, search (+ blog search), blog, article, pages, cart, policies, 404 |
| `app/(fragments)/` | Bare HTML parts the shared web components fetch (predictive search, quick view, recommendations, filtered grids, blog sections) — the headless stand-in for Shopify's Section Rendering API |
| `app/actions.js` | Server actions: cart, Buy it now, discount codes, localization, reviews |
| `components/sections/` | One component per theme section (`components/Sections.js` maps section types to them) |
| `components/` | Snippets as components (`ProductCard` = `snippets/product-card.liquid`, …) |
| `lib/theme.js` | The theme as content: settings with schema defaults, templates, section groups, `t()` |
| `lib/shopify.js`, `lib/admin.js` | Storefront / Admin API clients (server only; one request per query per page) |
| `lib/queries.js`, `collection.js`, `product.js`, `blog.js`, `cart.js` | Loaders and GraphQL fragments |
| `lib/env.js`, `ids.js`, `text.js`, `format.js` | Shared helpers |

## How it works

- Pages are server components; the shared web components load after hydration (`components/UiScripts.js`)
  and enhance the same markup as in the theme.
- Markets: the currency / language switchers keep the choice in cookies; every Storefront API request asks
  `@inContext(country, language)` and the cart gets the country.
- Cart: server actions (they work without JS); the cart id is an httpOnly cookie.
- Reviews: where the theme has Judge.me's widget, the same reviews from its product data (Admin API), with
  a "Write a review" form posting to Judge.me.
- SEO: metadata and canonicals, Product / BreadcrumbList / BlogPosting data, `sitemap.xml`, `robots.txt`.

## Deploy on Vercel

Vercel > Add New > Project, import the repository, **Root Directory: `storefront`** (Framework: Next.js).
Keep "Include files outside the Root Directory" on: the build uses `packages/` and the server reads
`theme/` (`next.config.mjs` traces those files into the functions). Environment Variables: everything from
`.env.example`, with `SITE_URL` = the project's address. Then add that address to project-server's
`ALLOWED_ORIGINS`.

## Differences from the theme

Search matches words (the Storefront API has no semantic search); app blocks other than Judge.me's review
widget are left out; the theme's text strings are English only.
