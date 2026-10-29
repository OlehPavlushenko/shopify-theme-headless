// A store policy: the markup Shopify renders into the theme's layout for /policies/* (.shopify-policy__*,
// styled in sections.css) — the title and the policy's text from Settings > Policies
import { notFound } from 'next/navigation';
import { getPolicy } from '@/lib/queries.js';

export async function generateMetadata({ params }) {
  const policy = await getPolicy((await params).handle);
  return policy ? { title: policy.title, alternates: { canonical: `/policies/${policy.handle}` } } : {};
}

export default async function PolicyPage({ params }) {
  const policy = await getPolicy((await params).handle);
  if (!policy) notFound();
  return (
    <div className="shopify-policy__container">
      <div className="shopify-policy__title">
        <h1>{policy.title}</h1>
      </div>
      <div className="shopify-policy__body">
        <div className="rte" dangerouslySetInnerHTML={{ __html: policy.body }} />
      </div>
    </div>
  );
}
