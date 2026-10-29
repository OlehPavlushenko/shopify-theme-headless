// Small API next to the theme: newsletter sign-up (POST /newsletter), contact form messages
// (POST /contact), back-in-stock requests (POST /notify) and the Spin to win wheel (POST /spin).
// Config: .env.local (see .env.example). Run: npm run dev (watch) or npm start. On Vercel the app runs as a
// function (api/index.js, vercel.json) and doesn't listen itself.
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import newsletter from './routes/newsletter.js';
import contact from './routes/contact.js';
import notify from './routes/notify.js';
import spin from './routes/spin.js';

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.set('trust proxy', 1); // behind a proxy (hosting, ngrok): the client IP for the rate limit
app.use(helmet());
app.use(express.json({ limit: '10kb' }));

// Only the storefront may call the API: browsers send Origin with every cross-site POST.
// cors() alone only withholds the headers (the request would still run), so others get a 403 first.
const onlyStorefront = [
  (req, res, next) =>
    allowedOrigins.includes(req.get('origin')) ? next() : res.status(403).json({ ok: false, error: 'forbidden_origin' }),
  cors({ origin: allowedOrigins }),
];
const limit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

app.get('/health', (req, res) => res.json({ ok: true }));
app.use('/newsletter', onlyStorefront, limit, newsletter);
app.use('/contact', onlyStorefront, limit, contact);
app.use('/notify', onlyStorefront, limit, notify);
app.use('/spin', onlyStorefront, limit, spin);

if (!process.env.VERCEL) {
  const port = Number(process.env.PORT) || 5000;
  app.listen(port, () => console.log(`API on http://localhost:${port} — allowed origins: ${allowedOrigins.join(', ') || 'none'}`));
}

export default app;
