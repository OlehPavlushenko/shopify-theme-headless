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

`GET /health` — `{ ok: true }`.

## Notes

- The token is an Admin API token of a custom app with `read_customers` and `write_customers`.
  Use a token of the store the theme runs on: the development store while developing.
- Production needs hosting with HTTPS (any Node 22 host); its URL goes into the theme settings.
