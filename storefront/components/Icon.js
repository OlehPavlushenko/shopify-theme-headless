// Inline SVG icon: the theme's icon set (theme/snippets/icon.liquid, generated into lib/icons.js),
// same attributes — stroke = currentColor, size via --icon-size
import icons from '@/lib/icons.js';

// The same svg as a string, for markup inside a <template> (React can't hydrate a template's children)
export function iconHtml(name) {
  return `<svg class="svg-icon svg-icon--${name}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name] ?? ''}</svg>`;
}

export default function Icon({ name, className = '' }) {
  return (
    <svg
      className={`svg-icon svg-icon--${name} ${className}`.trim()}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icons[name] ?? '' }}
    />
  );
}
