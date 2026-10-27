/**
 * <article-toc> — the table of contents and reading progress of an article:
 * - builds the list from the article's h2 headings (each gets an id), shown once there are two
 *   or more; the heading being read is marked (aria-current) while scrolling;
 * - links scroll smoothly below the header;
 * - [data-reading-progress] (anywhere on the page) fills with how much of the text is read.
 *
 * Markup contract:
 *   <article-toc data-content="#ArticleContent" hidden>
 *     <ol data-toc-list></ol>   (the links go here)
 *   </article-toc>
 *   <span data-reading-progress></span>   (--progress: 0–1 on it)
 * Without JS the block stays hidden (the article reads as usual).
 */
const slug = (text) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
const smooth = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

class ArticleToc extends HTMLElement {
  #ticking = false;

  connectedCallback() {
    this.content = document.querySelector(this.dataset.content);
    this.progress = document.querySelector('[data-reading-progress]');
    if (!this.content) return;
    this.headings = [...this.content.querySelectorAll('h2')];
    const list = this.querySelector('[data-toc-list]');
    if (this.headings.length >= 2 && list) {
      const used = new Set();
      list.replaceChildren(
        ...this.headings.map((heading, index) => {
          let id = heading.id || slug(heading.textContent) || `section-${index + 1}`;
          while (used.has(id)) id = `${id}-${index + 1}`;
          used.add(id);
          heading.id = id;
          const item = document.createElement('li');
          const link = document.createElement('a');
          link.href = `#${id}`;
          link.textContent = heading.textContent.trim();
          link.className = 'article-toc__link';
          item.append(link);
          return item;
        })
      );
      this.links = [...list.querySelectorAll('a')];
      this.hidden = false;
      this.addEventListener('click', this.#onClick);
    }
    window.addEventListener('scroll', this.#onScroll, { passive: true });
    this.#onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.#onScroll);
  }

  #offset() {
    return (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0) + 24;
  }

  #onClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    const heading = link && document.getElementById(link.hash.slice(1));
    if (!heading) return;
    event.preventDefault();
    window.scrollTo({ top: heading.getBoundingClientRect().top + window.scrollY - this.#offset(), behavior: smooth() ? 'smooth' : 'auto' });
    history.replaceState(null, '', link.hash);
    // A closed <details> (phones) closes after the jump
    const details = this.closest('details');
    if (details && matchMedia('(max-width: 1199px)').matches) details.open = false;
  };

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      const box = this.content.getBoundingClientRect();
      const read = Math.min(Math.max((window.innerHeight * 0.5 - box.top) / box.height, 0), 1);
      this.progress?.style.setProperty('--progress', read.toFixed(3));
      if (!this.links) return;
      const line = this.#offset() + 40;
      const passed = this.headings.filter((heading) => heading.getBoundingClientRect().top <= line);
      const current = passed.at(-1) ?? this.headings[0];
      // aria-current="true" (an empty value reads as false)
      this.links.forEach((link) => {
        if (link.hash === `#${current.id}`) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  };
}

if (!customElements.get('article-toc')) customElements.define('article-toc', ArticleToc);
