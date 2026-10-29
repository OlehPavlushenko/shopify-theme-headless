import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The repository root: packages/ui and packages/tokens live outside this folder
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export default {
  // @ui/* for the shared modules themselves too (they import each other; jsconfig paths only cover this folder)
  turbopack: { root, resolveAlias: { '@ui/*': '../packages/ui/js/*.js' } },
  outputFileTracingRoot: root,
  // Shopify's CDN resizes images itself (lib/image-loader.js): no image optimization on the host
  images: { loader: 'custom', loaderFile: './lib/image-loader.js' },
};
