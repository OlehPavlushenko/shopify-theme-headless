/* Generated from packages/ui/js/article-toc.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <article-toc> — the table of contents and reading progress of an article:
 * - builds the list from the article's h2 headings (each gets an id), shown once there are two
 *   or more; the heading being read is marked (aria-current) and named in the toggle;
 * - links scroll smoothly below the header (@ui/scroll);
 * - narrow screens: a bar at the bottom of the screen while the text is in view ([data-visible]),
 *   showing the section being read; it opens the list above it ([data-open]; Esc, a click outside
 *   or picking a section close it). Wide screens: the list itself (CSS);
 * - --progress (0–1) on itself and on [data-reading-progress] (anywhere on the page).
 * Each scroll frame reads the layout first, then writes (no forced reflow).
 *
 * Markup contract:
 *   <article-toc data-content="#ArticleContent" hidden>
 *     <button data-toc-toggle aria-expanded> … <span data-toc-current></span> </button>
 *     <div data-toc-panel> <ol data-toc-list></ol> </div>
 *   </article-toc>
 *   <span data-reading-progress></span>
 * Without JS the block stays hidden (the article reads as usual).
 */
import { headerOffset, scrollToElement } from '@ui/scroll';

// Any letters (Cyrillic headings keep meaningful anchors), digits, dashes
const slug = (text) =>
  text
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);

class ArticleToc extends HTMLElement {
  #ticking = false;
  #current = null;

  connectedCallback() {
    this.content = document.querySelector(this.dataset.content);
    this.progress = document.querySelector('[data-reading-progress]');
    this.toggle = this.querySelector('[data-toc-toggle]');
    this.currentLabel = this.querySelector('[data-toc-current]');
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
      this.toggle?.addEventListener('click', () => this.#setOpen(!this.hasAttribute('data-open')));
      document.addEventListener('click', this.#onOutside);
      document.addEventListener('keydown', this.#onKey);
    }
    window.addEventListener('scroll', this.#onScroll, { passive: true });
    window.addEventListener('resize', this.#onResize, { passive: true });
    // The first measurement after layout, not while the page renders
    requestAnimationFrame(() => {
      this.#onResize();
      this.#onScroll();
    });
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.#onScroll);
    window.removeEventListener('resize', this.#onResize);
    document.removeEventListener('click', this.#onOutside);
    document.removeEventListener('keydown', this.#onKey);
  }

  // The header offset only changes with the layout: read once, again on resize
  #onResize = () => {
    this.offset = headerOffset(24);
  };

  #setOpen(open) {
    this.toggleAttribute('data-open', open);
    this.toggle?.setAttribute('aria-expanded', String(open));
  }

  #onOutside = (event) => {
    if (this.hasAttribute('data-open') && !this.contains(event.target)) this.#setOpen(false);
  };

  #onKey = (event) => {
    if (event.key === 'Escape' && this.hasAttribute('data-open')) {
      this.#setOpen(false);
      this.toggle?.focus();
    }
  };

  #onClick = (event) => {
    const link = event.target.closest('a[href^="#"]');
    const heading = link && document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!heading) return;
    event.preventDefault();
    this.#setOpen(false);
    scrollToElement(heading, 24);
    history.replaceState(null, '', link.hash);
  };

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      // Reads
      const box = this.content.getBoundingClientRect();
      const height = window.innerHeight;
      const line = (this.offset ?? 0) + 40;
      const current = this.links
        ? (this.headings.filter((heading) => heading.getBoundingClientRect().top <= line).at(-1) ?? this.headings[0])
        : null;
      // Writes
      const read = Math.min(Math.max((height * 0.5 - box.top) / box.height, 0), 1).toFixed(3);
      this.progress?.style.setProperty('--progress', read);
      this.style.setProperty('--progress', read);
      // The bottom bar: while the text is on screen — from its start until its end is near the top
      const visible = box.top < height * 0.6 && box.bottom > height * 0.15;
      this.toggleAttribute('data-visible', visible);
      if (!visible && this.hasAttribute('data-open')) this.#setOpen(false);
      if (current && current !== this.#current) {
        this.#current = current;
        // aria-current="true" (an empty value reads as false)
        this.links.forEach((link) => {
          if (link.hash === `#${encodeURIComponent(current.id)}` || link.hash === `#${current.id}`)
            link.setAttribute('aria-current', 'true');
          else link.removeAttribute('aria-current');
        });
        if (this.currentLabel) this.currentLabel.textContent = current.textContent.trim();
      }
    });
  };
}

if (!customElements.get('article-toc')) customElements.define('article-toc', ArticleToc);
