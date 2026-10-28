/**
 * <read-more> — long text shown as its first lines with a "Read more" / "Read less" toggle (SEO text,
 * descriptions). The whole text is in the HTML; only its height is limited (styles: .read-more in
 * components.css, --read-more-lines on the element).
 *
 * Markup contract:
 *   <read-more style="--read-more-lines: 6">
 *     <div data-read-more-content>…</div>
 *     <button type="button" data-read-more-toggle data-label-more="Read more" data-label-less="Read less" hidden>Read more</button>
 *   </read-more>
 * The button shows only when the text is taller than the limit ([data-overflow]); [data-expanded]
 * while open. Without JS the text is shown in full (the limit applies with [data-ready] only).
 */
import { scrollBehavior } from '@ui/scroll';

class ReadMore extends HTMLElement {
  #abort;
  #observer;
  #content;
  #button;

  connectedCallback() {
    this.#content = this.querySelector('[data-read-more-content]');
    this.#button = this.querySelector('[data-read-more-toggle]');
    if (!this.#content || !this.#button) return;
    this.setAttribute('data-ready', '');
    const { signal } = (this.#abort = new AbortController());
    this.#button.addEventListener('click', this.#onToggle, { signal });
    this.#observer = new ResizeObserver(() => this.#measure());
    this.#observer.observe(this.#content);
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
  }

  #measure() {
    if (this.hasAttribute('data-expanded')) return;
    const overflow = this.#content.scrollHeight > this.#content.clientHeight + 1;
    this.toggleAttribute('data-overflow', overflow);
    this.#button.hidden = !overflow;
  }

  #onToggle = () => {
    const expanded = !this.hasAttribute('data-expanded');
    this.toggleAttribute('data-expanded', expanded);
    this.#button.setAttribute('aria-expanded', String(expanded));
    this.#button.textContent = expanded ? this.#button.dataset.labelLess : this.#button.dataset.labelMore;
    if (!expanded) this.scrollIntoView({ block: 'nearest', behavior: scrollBehavior() });
  };
}

if (!customElements.get('read-more')) customElements.define('read-more', ReadMore);
