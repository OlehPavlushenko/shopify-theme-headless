/**
 * Fetching HTML to swap into the page — pure helpers for the modules that re-render parts of it
 * (Shopify: the Section Rendering API; headless: any route rendering the same markup).
 *
 *   sectionUrl(url, sectionId) → the URL (absolute string) with ?section_id=<sectionId>
 *   partUrl(url, { section, endpoint }) → where a page's section is rendered on its own: with an
 *     endpoint (headless) <endpoint> plus the page URL's query, else sectionUrl(url, section)
 *   fetchHTML(url, { signal, cache }) → Promise<Document>; rejects on a network error, an abort or an
 *     error status (error.status). cache (optional): a Map url → pending text shared between calls;
 *     every call parses its own Document. A failed or aborted request leaves the cache at once, so
 *     the next call fetches again.
 *   importChildren(node) → the node's child nodes imported into this document (for replaceChildren)
 *   latest() → { next(), abort() }: next() aborts the request before and returns { signal, isCurrent() };
 *     isCurrent() turns false once a newer request started (or abort() ran) — drop that answer, so a
 *     slow older response never renders over a newer choice. abort(): on disconnect.
 */
const parse = (text) => new DOMParser().parseFromString(text, 'text/html');

async function request(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw Object.assign(new Error(`${response.status} ${response.statusText} (${url})`), { status: response.status });
  return response.text();
}

export function sectionUrl(url, sectionId) {
  const result = new URL(url, location.origin);
  result.searchParams.set('section_id', sectionId);
  return result.toString();
}

export function partUrl(url, { section, endpoint } = {}) {
  if (!endpoint) return sectionUrl(url, section);
  const result = new URL(endpoint, location.origin);
  result.search = new URL(url, location.origin).search;
  return result.toString();
}

export function fetchHTML(url, { signal, cache } = {}) {
  const key = String(url);
  if (!cache) return request(key, signal).then(parse);
  if (!cache.has(key)) {
    let settled = false;
    const forget = () => {
      if (cache.get(key) === pending) cache.delete(key);
    };
    const pending = request(key, signal).then(
      (text) => {
        settled = true;
        return text;
      },
      (error) => {
        settled = true;
        forget();
        throw error;
      }
    );
    // Right when it is aborted (not a tick later): a new call for the same URL fetches again
    signal?.addEventListener('abort', () => settled || forget(), { once: true });
    cache.set(key, pending);
  }
  return cache.get(key).then(parse);
}

export const importChildren = (node) => [...node.childNodes].map((child) => document.importNode(child, true));

export function latest() {
  let count = 0;
  let controller;
  return {
    next() {
      controller?.abort();
      controller = new AbortController();
      const id = ++count;
      return { signal: controller.signal, isCurrent: () => id === count };
    },
    abort() {
      controller?.abort();
      count += 1;
    },
  };
}
