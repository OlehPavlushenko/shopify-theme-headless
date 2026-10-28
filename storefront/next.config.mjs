import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The repository root: packages/ui and packages/tokens live outside this folder
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export default {
  turbopack: { root },
  outputFileTracingRoot: root,
  // Shopify's CDN resizes images itself (lib/image-loader.js): no image optimization on the host
  images: { loader: 'custom', loaderFile: './lib/image-loader.js' },
};
