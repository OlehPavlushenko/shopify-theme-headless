// Inline SVG icon: the theme's icon set (theme/snippets/icon.liquid, generated into lib/icons.js),
// same attributes — stroke = currentColor, size via --icon-size
import icons from '@/lib/icons.js';

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
