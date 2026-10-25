// ✅ shopify.js — ESM версия с @shopify/admin-api-client
import { createAdminApiClient } from '@shopify/admin-api-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });


const shopify = createAdminApiClient({
  storeDomain: process.env.SHOPIFY_STORE_NAME,
  apiVersion: process.env.SHOPIFY_API_VERSION,
  accessToken: process.env.SHOPIFY_ADMIN_API_PASSWORD
});

export default shopify;