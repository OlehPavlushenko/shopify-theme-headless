// Structured data as a <script type="application/ld+json"> ("<" escaped, so text can't close the tag)
export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
