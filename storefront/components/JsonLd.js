// Structured data as a <script type="application/ld+json">, as the theme outputs it next to the content it
// describes (snippets/breadcrumbs, sections/faq; snippets/structured-data)
import { scriptJson } from '@/lib/text.js';

export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: scriptJson(JSON.stringify(data)) }} />;
}
