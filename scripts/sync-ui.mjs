// Copies the shared UI package into the theme: packages/ui/{css,js}/<name> -> theme/assets/ui-<name>.
// theme/assets/ui-* files are generated: edit packages/ui instead. Stale ui-* files are removed.
// Usage: node scripts/sync-ui.mjs [--watch]
import { existsSync, readdirSync, readFileSync, unlinkSync, watch, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sources = ['css', 'js'].map((dir) => join(root, 'packages', 'ui', dir));
const assets = join(root, 'theme', 'assets');

const banner = (ext, from) =>
    ext === 'css' || ext === 'js' ? `/* Generated from ${from} by scripts/sync-ui.mjs. Do not edit here. */\n` : '';

function sync() {
    const expected = new Set();
    for (const dir of sources) {
        if (!existsSync(dir)) continue;
        for (const name of readdirSync(dir)) {
            if (name.startsWith('_')) continue;
            const ext = name.split('.').pop();
            const target = `ui-${name}`;
            const from = `packages/ui/${dir.split(/[\\/]/).pop()}/${name}`;
            const content = banner(ext, from) + readFileSync(join(dir, name), 'utf8');
            const out = join(assets, target);
            expected.add(target);
            if (!existsSync(out) || readFileSync(out, 'utf8') !== content) {
                writeFileSync(out, content);
                console.log(`sync: ${from} -> theme/assets/${target}`);
            }
        }
    }
    for (const name of readdirSync(assets)) {
        if (name.startsWith('ui-') && !expected.has(name)) {
            unlinkSync(join(assets, name));
            console.log(`sync: removed stale theme/assets/${name}`);
        }
    }
}

sync();

if (process.argv.includes('--watch')) {
    let timer;
    for (const dir of sources) {
        if (!existsSync(dir)) continue;
        watch(dir, () => {
            clearTimeout(timer);
            timer = setTimeout(sync, 100);
        });
    }
    console.log('sync: watching packages/ui');
}
