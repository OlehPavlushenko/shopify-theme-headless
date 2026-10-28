// Inline SVG icon, the same 24×24 set as theme/snippets/icon.liquid (stroke = currentColor, size via --icon-size)
const PATHS = {
  close: <path d="M6 6l12 12M18 6L6 18" />,
  bag: (
    <>
      <path d="M5 8h14l-1 12H6L5 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  'arrow-right': <path d="M5 12h14M13 6l6 6-6 6" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4.2-4.2" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

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
    >
      {PATHS[name]}
    </svg>
  );
}
