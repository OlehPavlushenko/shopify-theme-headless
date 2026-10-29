// Blog data in the shapes the theme's blog snippets use: a blog page (paginate blog.articles, with the
// chosen topics — current_tags), the blog's search results (search.results of articles) and an article
// page (with "Read next" and the products from the article's theme.products metafield).
// A blog's articles come in one request (the newest 250) and are filtered by topic and paged here, so
// the URLs are the theme's: /blogs/<blog>/tagged/<a>+<b>?page=<n>.
import { storefront } from './shopify.js';
import { ARTICLE, PRODUCT_CARD } from './queries.js';
import { findSection } from './theme.js';
import { pageParam } from './links.js';

// Liquid's handleize: lowercase, runs of other characters to one "-"
export const handleize = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');

// snippets/blog-topic-url: the blog URL with one topic toggled against the chosen ones (handles)
export function topicUrl(blogUrl, chosen, tag) {
  const handle = handleize(tag);
  const next = chosen.includes(handle) ? chosen.filter((item) => item !== handle) : [...chosen, handle];
  return next.length ? `${blogUrl}/tagged/${next.join('+')}` : blogUrl;
}

// A blog's own URL and the fields the pages show of it
const blogUrl = (handle) => `/blogs/${handle}`;
const blogInfo = (blog) => ({ handle: blog.handle, title: blog.title, url: blogUrl(blog.handle) });

// A blog with its newest 250 articles
async function getBlog(handle) {
  const data = await storefront(
    `#graphql
    query Blog($handle: String!) {
      blog(handle: $handle) {
        handle
        title
        seo { title description }
        articles(first: 250, sortKey: PUBLISHED_AT, reverse: true) { nodes { ${ARTICLE} } }
      }
    }`,
    { handle }
  );
  return data?.blog ?? null;
}

// A page of a list: the items on ?page=<n> and the next page's URL (with the rest of the query)
function paginate(items, params, path, perPage) {
  const page = pageParam(params);
  const shown = items.slice((page - 1) * perPage, page * perPage);
  const next = new URLSearchParams(params);
  next.set('page', page + 1);
  return {
    articles: shown,
    page,
    count: items.length,
    shown: (page - 1) * perPage + shown.length,
    nextUrl: page * perPage < items.length ? `${path}?${next}` : null,
  };
}

// The blog page: tags are handles from the URL (/tagged/a+b), articles with all of them
async function getBlogPage(handle, tags, params, { perPage = 9 } = {}) {
  const blog = await getBlog(handle);
  if (!blog) return null;
  const url = blogUrl(blog.handle);
  // The chosen topics by their names (current_tags), in the URL's order
  const names = new Map(blog.articles.nodes.flatMap((article) => article.tags).map((tag) => [handleize(tag), tag]));
  const chosen = tags.map(handleize).filter((tag) => names.has(tag));
  const matching = blog.articles.nodes.filter((article) => {
    const own = article.tags.map(handleize);
    return chosen.every((tag) => own.includes(tag));
  });
  const path = chosen.length ? `${url}/tagged/${chosen.join('+')}` : url;
  return {
    blog: { ...blogInfo(blog), seo: blog.seo },
    chosen,
    chosenNames: chosen.map((tag) => names.get(tag)),
    path,
    ...paginate(matching, params, path, perPage),
  };
}

// The page's title without the shop's name (snippets/document-title): the blog, its topics, the page
export function blogTitle(listing) {
  if (listing.terms !== undefined) return `${listing.blog?.title ?? 'Search'}: ${listing.terms}`;
  const tagged = listing.chosenNames.length ? ` – tagged "${listing.chosenNames.join(', ')}"` : '';
  return `${listing.blog.title}${tagged}${listing.page > 1 ? ` – Page ${listing.page}` : ''}`;
}

// The blog's search results (templates/search.blog.json): articles matching ?q= (Shopify searches the
// articles of every blog), the last word as a prefix
async function getArticleSearch(blogHandle, params, { perPage = 9 } = {}) {
  const terms = (params.get('q') ?? '').trim();
  const blog = blogHandle ? await getBlog(blogHandle) : null;
  const info = blog && blogInfo(blog);
  if (!terms) return { blog: info, terms: '', articles: [], count: 0, page: 1, shown: 0, nextUrl: null, path: '/search' };
  const data = await storefront(
    `#graphql
    query ArticleSearch($q: String!) {
      search(query: $q, first: 250, types: ARTICLE, prefix: LAST) {
        nodes { ... on Article { ${ARTICLE} } }
      }
    }`,
    { q: terms }
  );
  const found = (data?.search.nodes ?? []).filter((item) => item.handle);
  return { blog: info, terms, chosen: [], path: '/search', ...paginate(found, params, '/search', perPage) };
}

// The blog section for a URL path — ['blogs', <blog>] or [..., 'tagged', 'a+b'] (templates/blog.json), or
// ['search'] (the blog's search results, templates/search.blog.json, its section's blog) — with its listing
export async function blogListing(path, params) {
  const isSearch = path.length === 1 && path[0] === 'search';
  const { section, sections } = isSearch ? findSection('search', 'main-blog', 'blog') : findSection('blog', 'main-blog');
  if (!section) return null;
  const perPage = section.settings.per_page;
  if (isSearch) return { section, sections, listing: await getArticleSearch(section.settings.blog, params, { perPage }) };
  const [root, handle, tagged, tags] = path;
  if (root !== 'blogs' || !handle || (tagged && tagged !== 'tagged') || path.length > 4) return null;
  const listing = await getBlogPage(handle, tags ? tags.split(/[+ ]/).filter(Boolean) : [], params, { perPage });
  return listing && { section, sections, listing };
}

// "Read next": the blog's other articles, most shared tags first, the newest on a tie; three
function readNext(article, articles) {
  return articles
    .filter((item) => item.handle !== article.handle)
    .slice(0, 50)
    .map((item, index) => ({ item, index, shared: item.tags.filter((tag) => article.tags.includes(tag)).length }))
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .slice(0, 3)
    .map(({ item }) => item);
}

// An article page: the article (with its products), its blog and "Read next"
export async function getArticlePage(blogHandle, articleHandle) {
  const data = await storefront(
    `#graphql
    query Article($blog: String!, $article: String!) {
      blog(handle: $blog) {
        handle
        title
        articleByHandle(handle: $article) {
          ${ARTICLE}
          contentHtml
          authorV2 { name }
          seo { title description }
          products: metafield(namespace: "theme", key: "products") {
            references(first: 6) { nodes { ... on Product { ...ProductCard } } }
          }
        }
        articles(first: 50, sortKey: PUBLISHED_AT, reverse: true) { nodes { ${ARTICLE} } }
      }
    }
    ${PRODUCT_CARD}`,
    { blog: blogHandle, article: articleHandle }
  );
  const blog = data?.blog;
  const article = blog?.articleByHandle;
  if (!article) return null;
  return {
    blog: blogInfo(blog),
    article: { ...article, products: article.products?.references?.nodes.filter((item) => item.handle) ?? [] },
    related: readNext(article, blog.articles.nodes),
  };
}

// The blog search field's suggestions (predictive search with resources[type]=article)
export async function predictiveArticles(query) {
  const data = await storefront(
    `query PredictiveArticles($query: String!) { predictiveSearch(query: $query, limit: 6, types: [ARTICLE]) { articles { handle title blog { handle } } } }`,
    { query },
    { revalidate: 60 }
  );
  return data?.predictiveSearch?.articles ?? [];
}
