// The Shopify theme as this storefront's content source: Theme settings, color schemes, JSON templates,
// section groups and translations are read from theme/ (kept in step with the theme editor by
// `shopify theme dev --theme-editor-sync` and `npm run pull:live`). Missing values get the defaults of
// the section's {% schema %} / config/settings_schema.json, as Shopify does.
// Server only (reads files).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { cache } from 'react';
import { storefront } from './shopify.js';

const THEME = join(process.cwd(), '..', 'theme');

// JSON files written by Shopify start with a /* … */ banner
const readJSON = (path) =>
  JSON.parse(
    readFileSync(join(THEME, path), 'utf8')
      .replace(/^﻿/, '')
      .replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '')
  );

const defaultsOf = (settings = []) =>
  Object.fromEntries(
    settings.filter((setting) => setting.id && setting.default !== undefined).map((setting) => [setting.id, setting.default])
  );

// A section's {% schema %} (null when the file has none)
const schemaOf = cache((type) => {
  try {
    const source = readFileSync(join(THEME, 'sections', `${type}.liquid`), 'utf8');
    const json = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/)?.[1];
    return json ? JSON.parse(json) : null;
  } catch {
    return null;
  }
});

// Theme settings: settings_schema defaults, then config/settings_data.json "current"
export const getSettings = cache(() => {
  const schema = readJSON('config/settings_schema.json');
  const defaults = Object.assign({}, ...schema.map((group) => defaultsOf(group.settings)));
  const data = readJSON('config/settings_data.json');
  const current = typeof data.current === 'string' ? data.presets[data.current] : data.current;
  return { ...defaults, ...current };
});

// One section of a template or group, with defaults filled in; blocks in their order, without disabled ones
function resolveSection(id, section) {
  const schema = schemaOf(section.type) ?? {};
  const blockSchemas = Object.fromEntries((schema.blocks ?? []).map((block) => [block.type, block]));
  const blocks = (section.block_order ?? Object.keys(section.blocks ?? {}))
    .map((blockId) => ({ id: blockId, ...section.blocks[blockId] }))
    .filter((block) => !block.disabled)
    .map((block) => ({ ...block, settings: { ...defaultsOf(blockSchemas[block.type]?.settings), ...block.settings } }));
  return {
    id,
    type: section.type,
    className: schema.class ?? '',
    settings: { ...defaultsOf(schema.settings), ...section.settings },
    blocks,
  };
}

// The sections of a JSON template (templates/<name>.json) or a section group (sections/<name>.json), in order
export const getSections = cache((path) => {
  const file = readJSON(path);
  return file.order.filter((id) => !file.sections[id].disabled).map((id) => resolveSection(id, file.sections[id]));
});

// Storefront strings: {{ 'key' | t: name: value }} from locales/en.default.json
const locale = cache(() => readJSON('locales/en.default.json'));

export function t(key, values = {}) {
  let text = key.split('.').reduce((node, part) => node?.[part], locale());
  if (text && typeof text === 'object') text = values.count === 1 ? text.one : text.other;
  if (typeof text !== 'string') return key;
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, name) => values[name] ?? '');
}

// Theme images (settings values "shopify://shop_images/<name>") live in the shop's Files on the CDN:
// /s/files/1/<shop id, 12 digits as 4/4/4>/files/<name>
const filesBase = cache(async () => {
  const data = await storefront('{ shop { id } }', {}, { revalidate: 86400 });
  const id = data?.shop.id.split('/').pop().padStart(12, '0');
  return id ? `https://cdn.shopify.com/s/files/1/${id.slice(0, 4)}/${id.slice(4, 8)}/${id.slice(8)}/files/` : null;
});

export async function imageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('http')) return value;
  const name = value.match(/^shopify:\/\/shop_images\/(.+)$/)?.[1];
  const base = name && (await filesBase());
  return base ? base + name : null;
}

// Theme settings as CSS: snippets/theme-tokens.liquid (radii, page width, status colors) and
// snippets/color-schemes.liquid (one .color-<id> class per scheme, the first one also on :root)
export function themeCss() {
  const s = getSettings();
  const tokens = `:root {
  --page-width: ${s.page_width / 10}rem;
  --radius-button: ${s.radius_button}px;
  --radius-input: ${s.radius_input}px;
  --radius-card: ${s.radius_card}px;
  --radius-media: ${s.radius_media}px;
  --radius-badge: ${s.radius_badge}px;
  --color-success: ${s.color_success};
  --color-info: ${s.color_info};
  --color-warning: ${s.color_warning};
  --color-danger: ${s.color_danger};
  --color-focus: ${s.color_focus};
  --color-rating: ${s.color_rating || '#c9772b'};
  --font-body-scale: ${s.body_scale / 100};
  --font-heading-scale: ${s.heading_scale / 100};
}`;
  const schemes = Object.entries(s.color_schemes ?? {}).map(([id, { settings: c }], index) => {
    const selector = `${index === 0 ? ':root, ' : ''}.color-${id}`;
    return `${selector} {
  --color-background: ${c.background};
  --color-background-gradient: ${c.background_gradient || 'none'};
  --color-foreground: ${c.foreground};
  --color-text-muted: color-mix(in srgb, ${c.foreground} 80%, transparent);
  --color-text-disabled: color-mix(in srgb, ${c.foreground} 45%, transparent);
  --color-heading: ${c.heading};
  --color-link-hover: ${c.link_hover};
  --color-accent: ${c.accent};
  --color-accent-2: ${c.accent_2};
  --color-surface: ${c.surface};
  --color-border: ${c.border};
  --color-button: ${c.button};
  --color-button-label: ${c.button_label};
  --color-button-hover: ${c.button_hover};
  --color-button-label-hover: ${c.button_label_hover};
  --color-button-secondary: ${c.button_secondary};
  --color-button-secondary-label: ${c.button_secondary_label};
  --color-input-background: ${c.input_background};
  --color-input-text: ${c.input_text};
}
.shopify-section:has(> .color-${id}.section-spacing) + .shopify-section > .color-${id}.section-spacing { padding-top: 0; }`;
  });
  return [tokens, ...schemes].join('\n');
}
