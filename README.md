# Loyalty storefront

Shopify theme for `education-checkout-extensibility.myshopify.com`, built as a headless-ready
monorepo. Conventions and structure: [ARCHITECTURE.md](ARCHITECTURE.md).

## Requirements

- Node.js 22.12+
- Shopify CLI 5.x (`npm install -g @shopify/cli@latest`)

## Getting started

```bash
npm run dev      # syncs packages/ui into the theme and starts `shopify theme dev` on theme/
npm run watch    # in a second terminal while editing packages/ui
npm run check    # theme check
```

Open http://127.0.0.1:9292. The theme editor link is printed by `shopify theme dev`.

## Releasing

`theme dev` works on a hidden development theme, which can't be published. A release is a new
unpublished theme in the store's library:

```bash
npm run pull:live   # takes what was changed in the live theme's editor (settings, templates, section groups)
git diff            # review, commit
npm run release     # sync + lint, then pushes theme/ as a new unpublished theme (asks for a name, e.g. "Studio 1.1")
```

Then Online Store → Themes: Preview, Publish. The previous version stays in the library for a
rollback. Edit code only here, never in the admin's code editor: the next release overwrites it.

## Folders

| Path | What it is |
|---|---|
| `theme/` | The Shopify theme being built |
| `storefront/` | Headless storefront (Next.js) on the same packages — see its README |
| `project-server/` | Small API: newsletter, contact, back in stock, Spin to win |
| `packages/tokens/` | Design tokens (single source of defaults) |
| `packages/ui/` | Shared CSS and JS used by the theme and a future headless storefront |
| `scripts/` | Build helpers |

## Status

Header, search, menus, announcement strips and the cart are done; home, product and collection
sections are next. What is done, what comes next and why: [docs/ROADMAP.md](docs/ROADMAP.md).
Code conventions: [ARCHITECTURE.md](ARCHITECTURE.md).

`theme/` is based on [Shopify Skeleton Theme](https://github.com/Shopify/skeleton-theme) v1.0.0 (MIT,
see `theme/LICENSE.md`).
