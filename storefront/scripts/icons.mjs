// Generates lib/icons.js from the theme's icon sets — theme/snippets/icon.liquid (the line icons) and
// theme/snippets/payment-icon.liquid (payment marks): one source for both. Runs before `next dev` and
// `next build` (package.json).
import { readFileSync, writeFileSync } from 'node:fs';

// The case's branches of a snippet: { name: inner SVG markup }
function parse(file) {
  const source = readFileSync(new URL(`../../theme/snippets/${file}`, import.meta.url), 'utf8');
  const icons = {};
  for (const [, names, body] of source.matchAll(/{%-?\s*when\s+([^%]+?)\s*-?%}([\s\S]*?)(?={%-?\s*(?:when|endcase))/g)) {
    for (const name of names.match(/'([^']+)'/g)) icons[name.slice(1, -1)] = body.trim().replace(/\s*\n\s*/g, '');
  }
  return icons;
}

const icons = parse('icon.liquid');
const payment = parse('payment-icon.liquid');
writeFileSync(
  new URL('../lib/icons.js', import.meta.url),
  `// Generated from theme/snippets/icon.liquid and payment-icon.liquid by scripts/icons.mjs. Do not edit here.\n` +
    `export default ${JSON.stringify(icons, null, 2)};\n\nexport const payment = ${JSON.stringify(payment, null, 2)};\n`
);
console.log(`icons: ${Object.keys(icons).length} + ${Object.keys(payment).length} payment -> lib/icons.js`);
