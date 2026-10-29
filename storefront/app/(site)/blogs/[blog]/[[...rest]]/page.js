// A blog and its articles, as in the theme: /blogs/<blog> and /blogs/<blog>/tagged/<a>+<b> render
// templates/blog.json (page header with the blog search, main-blog, …), /blogs/<blog>/<article>
// templates/article.json (main-article). Topic and paged lists are noindex, as in the theme.
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd.js';
import Sections from '@/components/Sections.js';
import { blogListing, blogTitle, getArticlePage } from '@/lib/blog.js';
import { getTemplate } from '@/lib/theme.js';

async function load(params, searchParams) {
  const { blog, rest = [] } = await params;
  if (rest.length === 1) return { article: await getArticlePage(blog, decodeURIComponent(rest[0])) };
  const query = new URLSearchParams(await searchParams);
  return { list: await blogListing(['blogs', blog, ...rest.map(decodeURIComponent)], query), query };
}

export async function generateMetadata({ params, searchParams }) {
  const { article, list, query } = await load(params, searchParams);
  if (article) {
    const { article: item, blog } = article;
    return {
      title: item.seo?.title || item.title,
      description: item.seo?.description || item.excerpt || item.content.slice(0, 160),
      alternates: { canonical: `${blog.url}/${item.handle}` },
      openGraph: { type: 'article', images: item.image ? [{ url: item.image.url }] : [] },
    };
  }
  if (!list) return {};
  const { listing } = list;
  return {
    title: blogTitle(listing),
    description: listing.blog.seo?.description || undefined,
    alternates: { canonical: listing.blog.url },
    ...((listing.chosen.length > 0 || query.has('page')) && { robots: { index: false, follow: true } }),
  };
}

export default async function BlogPage({ params, searchParams }) {
  const { article, list } = await load(params, searchParams);
  if (article) {
    const site = process.env.SITE_URL || '';
    const { article: item, blog } = article;
    return (
      <>
        <Sections sections={getTemplate('article').sections} context={{ template: 'article', ...article }} />
        <JsonLd
          data={{
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: item.title,
            datePublished: item.publishedAt,
            author: item.authorV2?.name ? { '@type': 'Person', name: item.authorV2.name } : undefined,
            image: item.image?.url,
            url: `${site}${blog.url}/${item.handle}`,
          }}
        />
      </>
    );
  }
  if (!list) notFound();
  return <Sections sections={list.sections} context={{ template: 'blog', blog: list.listing.blog, listing: list.listing }} />;
}
