// Any other URL: the site's 404 (not-found.js) inside the site layout
import { notFound } from 'next/navigation';

export default function Missing() {
  notFound();
}
