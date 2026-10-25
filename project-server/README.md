# project-server

Small API next to the theme. One job for now: **newsletter sign-up** straight into Shopify
customers (email marketing consent + `newsletter` tag), so the theme can subscribe without a page
reload. Other endpoints (the old custom checkout with WayForPay) were removed; they are in git
history (commit "project-server: snapshot …") if they are needed again.

## Run

```bash
cp .env.example .env.local   # fill in the store, token and allowed origins
npm run server:install       # from the repo root, once
npm run server               # from the repo root: http://localhost:5000, restarts on changes
```

## API

`POST /newsletter` — JSON `{ "email": "...", "token": "<reCAPTCHA v3 token, action newsletter>" }`

| Answer | Meaning |
|---|---|
| `200 { ok: true, status: "subscribed" }` | new subscriber, or an existing customer now subscribed |
| `200 { ok: true, status: "already_subscribed" }` | nothing to do |
| `400 { ok: false, error: "invalid_email" }` | |
| `403 { ok: false, error: "captcha_failed" }` | only when `RECAPTCHA_SECRET` is set |
| `403 { ok: false, error: "forbidden_origin" }` | the request is not from an origin in `ALLOWED_ORIGINS` |
| `429` | more than 10 requests a minute from one IP |
| `502 { ok: false, error: "server_error" }` | Shopify refused or is unreachable (details in the server log) |

`GET /health` — `{ ok: true }`.

## Notes

- The token is an Admin API token of a custom app with `read_customers` and `write_customers`.
  Use a token of the store the theme runs on: the development store while developing.
- Production needs hosting with HTTPS (any Node 22 host); its URL goes into the theme settings.
