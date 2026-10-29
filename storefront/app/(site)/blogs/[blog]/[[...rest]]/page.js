// A blog and its articles, as in the theme: /blogs/<blog> and /blogs/<blog>/tagged/<a>+<b> render
// templates/blog.json (page header with the blog search, main-blog, …), /blogs/<blog>/<article>
// templates/article.json (main-article). Topic and paged lists are noindex, as in the theme.
import { notFound } from 'next/navigation';
import JsonLd from '@/components/JsonLd.js';
import Sections from '@/components/Sections.js';
import { SITE_URL } from '@/lib/env.js';
import { blogListing, blogTitle, getArticlePage } from '@/lib/blog.js';
import { pageMetadata } from '@/lib/seo.js';
import { getTemplate } from '@/lib/theme.js';

// The article, or the blog listing, for the URL (the request's queries are memoized: generateMetadata and
// the page share them)
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
    return pageMetadata({
      title: item.seo?.title || item.title,
      description: item.seo?.description || item.excerpt || item.content.slice(0, 160),
      path: `${blog.url}/${item.handle}`,
      type: 'article',
      image: item.image && { url: item.image.url },
    });
  }
  if (!list) return {};
  const { listing } = list;
  return pageMetadata({
    title: blogTitle(listing),
    description: listing.blog.seo?.description,
    path: listing.blog.url,
    noindex: listing.chosen.length > 0 || query.has('page'),
  });
}

export default async function BlogPage({ params, searchParams }) {
  const { article, list } = await load(params, searchParams);
  if (article) {
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
            url: `${SITE_URL}${blog.url}/${item.handle}`,
          }}
        />
      </>
    );
  }
  if (!list) notFound();
  return <Sections sections={list.sections} context={{ template: 'blog', blog: list.listing.blog, listing: list.listing }} />;
}
