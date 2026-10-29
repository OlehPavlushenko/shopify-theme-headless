// Generates lib/icons.js from the theme's icon set (theme/snippets/icon.liquid): one source for both.
// Runs before `next dev` and `next build` (package.json).
import { readFileSync, writeFileSync } from 'node:fs';

const source = readFileSync(new URL('../../theme/snippets/icon.liquid', import.meta.url), 'utf8');
const icons = {};
for (const [, names, body] of source.matchAll(/{%-?\s*when\s+([^%]+?)\s*-?%}([\s\S]*?)(?={%-?\s*(?:when|endcase))/g)) {
  for (const name of names.match(/'([^']+)'/g)) icons[name.slice(1, -1)] = body.trim().replace(/\s*\n\s*/g, '');
}
writeFileSync(
  new URL('../lib/icons.js', import.meta.url),
  `// Generated from theme/snippets/icon.liquid by scripts/icons.mjs. Do not edit here.\nexport default ${JSON.stringify(icons, null, 2)};\n`
);
console.log(`icons: ${Object.keys(icons).length} -> lib/icons.js`);
