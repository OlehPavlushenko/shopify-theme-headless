// Bare root layout for HTML fragments that the shared web components fetch and swap in (the headless
// counterpart of Shopify's Section Rendering API): no header, footer, styles or scripts
export const metadata = { robots: { index: false, follow: false } };

export default function FragmentsLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
