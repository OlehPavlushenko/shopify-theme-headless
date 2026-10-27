/**
 * <faq-search> — filters an FAQ list as you type (all words must match the question or its answer).
 * Topics with nothing left hide, and so do their links in the topic nav; an empty state shows when
 * nothing matches. Server-rendered list; without JS the field is hidden and every question shows.
 *
 * Markup contract:
 *   <faq-search>
 *     <input type="search" data-faq-input>
 *     <a href="#topic-id" data-faq-topic-link> (optional nav)
 *     <h3 id="topic-id" data-faq-topic>, then <details data-faq-item data-topic="topic-id">…
 *     <div data-faq-empty hidden>… <span data-faq-terms></span> …</div>
 *     <p data-faq-status class="visually-hidden" role="status" data-label="%n questions found"></p>
 *   </faq-search>
 * State: [data-ready] once enhanced (the field shows), [data-searching] while a query is set.
 */
const normalize = (text) => text.toLowerCase().replace(/\s+/g, ' ').trim();

class FaqSearch extends HTMLElement {
  #timer;

  connectedCallback() {
    this.input = this.querySelector('[data-faq-input]');
    if (!this.input) return;
    this.items = [...this.querySelectorAll('[data-faq-item]')].map((item) => ({ item, text: normalize(item.textContent) }));
    this.topics = [...this.querySelectorAll('[data-faq-topic]')];
    this.links = [...this.querySelectorAll('[data-faq-topic-link]')];
    this.empty = this.querySelector('[data-faq-empty]');
    this.status = this.querySelector('[data-faq-status]');
    this.input.addEventListener('input', () => {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => this.#filter(), 120);
    });
    this.setAttribute('data-ready', '');
  }

  #filter() {
    const query = normalize(this.input.value);
    const words = query ? query.split(' ') : [];
    let found = 0;
    for (const { item, text } of this.items) {
      const match = words.every((word) => text.includes(word));
      item.hidden = !match;
      if (match) found += 1;
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
  }
}

if (!customElements.get('faq-search')) customElements.define('faq-search', FaqSearch);
