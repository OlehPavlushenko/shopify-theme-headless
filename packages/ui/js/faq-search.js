/**
 * <faq-search> — a long FAQ made easy to use:
 * - filters the questions as you type (all words must match the question or its answer), marks
 *   the matches (<mark>) and opens the questions whose match is in the answer; clearing the field
 *   brings back how it was. Topics with nothing left hide, and so do their nav links; an empty
 *   state shows when nothing matches;
 * - topic links scroll smoothly to their topic, below the header (and the sticky tools bar);
 * - the link of the topic being read is marked (aria-current) while scrolling.
 * Server-rendered list; without JS the field is hidden, links jump and every question shows.
 *
 * Markup contract:
 *   <faq-search>
 *     [data-faq-tools] (sticky bar: input[type=search][data-faq-input], a[data-faq-topic-link] href="#topic-id")
 *     <h3 id="topic-id" data-faq-topic>, then <details data-faq-item data-topic="topic-id">
 *       <summary> .accordion__title </summary> .accordion__content
 *     <div data-faq-empty hidden>… <span data-faq-terms></span> …</div>
 *     <p data-faq-status class="visually-hidden" role="status" data-label="%n questions found"></p>
 *   </faq-search>
 * State: [data-ready] once enhanced (the field shows), [data-searching] while a query is set.
 */
import { headerOffset, scrollBehavior } from '@ui/scroll';

const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Unwraps earlier marks, then wraps every match of the words in the text nodes of root
function highlight(root, words) {
  root.querySelectorAll('mark[data-faq-mark]').forEach((mark) => mark.replaceWith(mark.textContent));
  root.normalize();
  if (!words.length) return;
  const source = `(${words.map(escapeRegExp).join('|')})`;
  // test() without the g flag: a global regex keeps lastIndex from one node to the next
  const test = new RegExp(source, 'i');
  const pattern = new RegExp(source, 'gi');
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (test.test(walker.currentNode.nodeValue)) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const parts = node.nodeValue.split(pattern);
    node.replaceWith(
      ...parts.map((part, index) => {
        if (index % 2 === 0) return part;
        const mark = document.createElement('mark');
        mark.dataset.faqMark = '';
        mark.textContent = part;
        return mark;
      })
    );
  }
}

class FaqSearch extends HTMLElement {
  #timer;
  #ticking = false;
  #current = null;

  connectedCallback() {
    this.input = this.querySelector('[data-faq-input]');
    this.tools = this.querySelector('[data-faq-tools]');
    this.items = [...this.querySelectorAll('[data-faq-item]')].map((item) => ({
      item,
      text: normalize(item.textContent),
      title: item.querySelector('.accordion__title'),
      content: item.querySelector('.accordion__content'),
      open: item.open,
      // "One answer open at a time" groups the <details> by name; searching opens several
      group: item.getAttribute('name'),
    }));
    this.topics = [...this.querySelectorAll('[data-faq-topic]')];
    this.links = [...this.querySelectorAll('[data-faq-topic-link]')];
    this.empty = this.querySelector('[data-faq-empty]');
    this.status = this.querySelector('[data-faq-status]');
    this.input?.addEventListener('input', () => {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.#filter(), 120);
    });
    this.addEventListener('click', this.#onClick);
    if (this.topics.length) window.addEventListener('scroll', this.#onScroll, { passive: true });
    this.setAttribute('data-ready', '');
  }

  disconnectedCallback() {
    window.removeEventListener('scroll', this.#onScroll);
  }

  // Space taken at the top: the header's full height (it may slide back in while scrolling up) and,
  // on phones, the sticky tools bar
  #offset() {
    const bar = this.tools && matchMedia('(max-width: 989px)').matches ? this.tools.offsetHeight : 0;
    return headerOffset(bar + 16);
  }

  #onClick = (event) => {
    const link = event.target.closest('[data-faq-topic-link]');
    if (!link) return;
    const topic = this.querySelector(link.hash);
    if (!topic) return;
    event.preventDefault();
    window.scrollTo({ top: topic.getBoundingClientRect().top + window.scrollY - this.#offset(), behavior: scrollBehavior() });
    history.replaceState(null, '', link.hash);
    this.#setCurrent(topic.id);
  };

  #onScroll = () => {
    if (this.#ticking) return;
    this.#ticking = true;
    requestAnimationFrame(() => {
      this.#ticking = false;
      const line = this.#offset() + 24;
      const passed = this.topics.filter((topic) => !topic.hidden && topic.getBoundingClientRect().top <= line);
      this.#setCurrent(passed.at(-1)?.id ?? this.topics.find((topic) => !topic.hidden)?.id);
    });
  };

  // Only on a change: a swipe through the topics row isn't undone by the next page scroll
  #setCurrent(id) {
    if (id === this.#current) return;
    this.#current = id;
    for (const link of this.links) {
      const current = link.hash === `#${id}`;
      if (current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
      // Phones: the topics row scrolls sideways — bring the new current topic into view
      const row = link.closest('.faq__nav-list');
      if (current && row.scrollWidth > row.clientWidth) {
        row.scrollTo({ left: link.parentElement.offsetLeft - row.offsetLeft - 16, behavior: scrollBehavior() });
      }
    }
  }

  #filter() {
    const query = normalize(this.input.value);
    const words = query ? query.split(' ') : [];
    let found = 0;
    for (const entry of this.items) {
      const match = words.every((word) => entry.text.includes(word));
      entry.item.hidden = !match;
      if (match) found += 1;
      if (entry.title) highlight(entry.title, match ? words : []);
      if (entry.content) highlight(entry.content, match ? words : []);
      // Searching: open the answers that hold the match (out of the one-open group, so several can
      // be); cleared: back to how they were
      if (entry.group) {
        if (words.length) entry.item.removeAttribute('name');
        else entry.item.setAttribute('name', entry.group);
      }
      if (words.length) {
        const inAnswer = match && words.some((word) => !normalize(entry.title?.textContent ?? '').includes(word));
        entry.item.open = inAnswer || (match && entry.open);
      } else {
        entry.item.open = entry.open;
      }
    }
    // A topic (and its nav link) shows while at least one of its questions does
    for (const topic of this.topics) {
      const visible = this.items.some(({ item }) => item.dataset.topic === topic.id && !item.hidden);
      topic.hidden = !visible;
      this.links.filter((link) => link.hash === `#${topic.id}`).forEach((link) => (link.parentElement.hidden = !visible));
    }
    this.toggleAttribute('data-searching', words.length > 0);
    if (this.empty) {
      this.empty.hidden = found > 0;
      const terms = this.empty.querySelector('[data-faq-terms]');
      if (terms) terms.textContent = this.input.value.trim();
    }
    if (this.status) this.status.textContent = words.length ? this.status.dataset.label.replace('%n', found) : '';
    this.#onScroll();
  }
}

if (!customElements.get('faq-search')) customElements.define('faq-search', FaqSearch);
