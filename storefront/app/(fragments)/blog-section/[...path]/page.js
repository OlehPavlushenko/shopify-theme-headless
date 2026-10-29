// The blog's section on its own for any blog URL, for <section-swap> (@ui/section-swap, data-endpoint-base)
// and <load-more> (@ui/load-more, data-endpoint): /blog-section/blogs/<blog>[/tagged/<a>+<b>]?page=<n>,
// or /blog-section/search?q=…&view=blog (the blog's search results)
import { notFound } from 'next/navigation';
import MainBlog from '@/components/sections/MainBlog.js';
import { blogListing } from '@/lib/blog.js';

export default async function BlogSection({ params, searchParams }) {
  const { path } = await params;
  const found = await blogListing(path.map(decodeURIComponent), new URLSearchParams(await searchParams));
  if (!found) notFound();
  return <MainBlog section={found.section} context={{ listing: found.listing }} />;
}
