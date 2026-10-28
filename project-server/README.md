# project-server

Small API next to the theme: **newsletter sign-up** straight into Shopify customers (email
marketing consent + `newsletter` tag) and **contact form messages** (kept on the customer: note +
`contact` tag), so the theme sends both without a page reload. Other endpoints (the old custom checkout with WayForPay) were removed; they are in git
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

`POST /contact` — JSON `{ "name": "...", "email": "...", "phone": "...", "message": "...", "token": "<reCAPTCHA v3 token, action contact>" }`
(name and phone optional). The sender is found by email or created (no marketing consent); the
message goes on top of the customer's note with the date, phone and name, and the customer gets the
tag `contact`. In the admin: Customers → filter by the tag `contact`. An email to the team: a
Shopify Flow workflow "Customer tags added" (tag `contact`) → "Send internal email".

| Answer | Meaning |
|---|---|
| `200 { ok: true }` | saved |
| `400 { ok: false, error: "invalid_email" \| "invalid_phone" \| "invalid_message" }` | message empty or over 5000 characters |
| `403`, `429`, `502` | as for `/newsletter` (`captcha_failed`, `forbidden_origin`, `server_error`) |

`POST /notify` — JSON `{ "email": "...", "variant": "<variant id>", "product": "<title / variant>", "token": "<reCAPTCHA v3 token, action notify>" }`
— "notify me when it's back in stock" on the product page. Kept the same way as a contact message:
a note line with the product and variant, tag `back-in-stock`. This only collects the requests; the
email when the product is back goes from the admin (Shopify Email to the customers with the tag,
or a Flow / marketing app automation).

| Answer | Meaning |
|---|---|
| `200 { ok: true }` | saved |
| `400 { ok: false, error: "invalid_email" \| "invalid_product" }` | |
| `403`, `429`, `502` | as above |

`POST /spin` — JSON `{ "email": "...", "prizes": "<the wheel's prize list, a JSON string>", "signature": "<its HMAC-SHA256>", "token": "<reCAPTCHA v3 token, action spin>" }`
— the Spin to win wheel. Signs the email up (as `/newsletter`) and picks the prize here, by weight,
once per email: the prize is kept on the customer (metafield `custom.spin_prize`, tag `spin-wheel`)
and every later spin of that email gets the same prize back. The prize list comes from the theme
(the popup's Prize blocks) signed with `THEME_SECRET` (Liquid `hmac_sha256` with the theme setting
Integrations > API secret), so the chances can't be changed in the browser; without `THEME_SECRET`
the list isn't checked (local development only).

| Answer | Meaning |
|---|---|
| `200 { ok: true, status: "spun" \| "already_spun", subscribed, prize: { label, code } }` | the prize (the same one again when already spun) |
| `400 { ok: false, error: "invalid_email" \| "invalid_prizes" }` | `invalid_prizes`: not signed, changed, or not 2–12 prizes |
| `403`, `429`, `502` | as above |

`GET /health` — `{ ok: true }`.

## Notes

- The token is an Admin API token of a custom app with `read_customers` and `write_customers`.
  Use a token of the store the theme runs on: the development store while developing.
- Production needs hosting with HTTPS (any Node 22 host); its URL goes into the theme settings.

## Deploy on Render

`render.yaml` in the repository root is a Blueprint: Render > New > Blueprint, pick the repository,
fill in the values it asks for (from `.env.local`; `ALLOWED_ORIGINS` = the store's domain only, PORT is
set by Render). Then Theme settings > Integrations: API URL = `https://<service>.onrender.com`,
API secret = `THEME_SECRET`. The free plan sleeps after 15 minutes idle; the first request wakes it
in up to a minute.
