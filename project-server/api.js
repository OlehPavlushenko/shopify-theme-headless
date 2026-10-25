import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

// 🔧 Настройка пути к .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = ['https://bioharmony.com.ua', 'https://4ba1cfb79ac8.ngrok-free.app'];

app.use((req, res, next) => {
  const userAgent = req.headers['user-agent']?.toLowerCase() || '';
  const blockedAgents = ['curl', 'python', 'wget', 'scrapy', 'httpclient'];

  if (blockedAgents.some(agent => userAgent.includes(agent))) {
    return res.status(403).json({ error: 'Forbidden: Suspicious user-agent' });
  }
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(helmet());

const sensitiveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many requests. Please try again later.',
});

import newsletterRouter from './routes/newsletter.js';
import checkoutRoute from './routes/checkout.js';
import callbackRouter from './routes/callback.js';

app.use('/newsletter', cors(corsOptions), sensitiveLimiter, newsletterRouter);
app.use('/checkout', cors(corsOptions), sensitiveLimiter, checkoutRoute);
app.use('/callback/wayforpay', callbackRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на http://localhost:${PORT}`);
});
