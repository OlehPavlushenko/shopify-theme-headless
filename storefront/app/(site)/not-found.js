// 404: the theme's main-404 — heading, text, links home and to all products
import Link from 'next/link';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="section-spacing">
      <div className="page-width empty-state">
        <h1 className="h2">Page not found</h1>
        <p>The page you were looking for doesn’t exist or has moved.</p>
        <div className="cluster">
          <Link href="/" className="btn">
            Go to the home page
          </Link>
          <Link href="/collections/all" className="btn btn--outline">
            Shop all products
          </Link>
        </div>
      </div>
    </div>
  );
}
