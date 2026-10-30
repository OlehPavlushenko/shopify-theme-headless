/* Generated from packages/ui/js/tabs.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <ui-tabs> — tabs that show one panel at a time (a product list's collection tabs).
 *
 * Markup contract:
 *   <ui-tabs>
 *     <div role="tablist" aria-label="…">
 *       <button role="tab" id="t1" aria-controls="p1" aria-selected="true">…</button>
 *       <button role="tab" id="t2" aria-controls="p2" aria-selected="false" tabindex="-1">…</button>
 *     </div>
 *     <div role="tabpanel" id="p1" aria-labelledby="t1">…</div>
 *     <div role="tabpanel" id="p2" aria-labelledby="t2" hidden>…</div>
 *   </ui-tabs>
 * Click or Enter / Space selects a tab; ←/→, Home and End move between tabs and select them (the ARIA
 * tabs pattern with automatic activation). Only the selected tab is in the Tab order.
 */
class UiTabs extends HTMLElement {
  #abort;

  connectedCallback() {
    const { signal } = (this.#abort = new AbortController());
    this.addEventListener('click', this.#onClick, { signal });
    this.addEventListener('keydown', this.#onKeydown, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
  }

  get #tabs() {
    return [...this.querySelectorAll(':scope [role="tablist"] > [role="tab"]')];
  }

  #select(tab) {
    for (const other of this.#tabs) {
      const selected = other === tab;
      other.setAttribute('aria-selected', String(selected));
      other.tabIndex = selected ? 0 : -1;
      const panel = this.querySelector(`#${CSS.escape(other.getAttribute('aria-controls'))}`);
      if (panel) panel.hidden = !selected;
    }
  }

  #onClick = (event) => {
    const tab = event.target.closest('[role="tab"]');
    if (tab && this.#tabs.includes(tab)) this.#select(tab);
  };

  #onKeydown = (event) => {
    const tabs = this.#tabs;
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const last = tabs.length - 1;
    const next = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const tab = tabs[(next + tabs.length) % tabs.length];
    this.#select(tab);
    tab.focus();
  };
}

if (!customElements.get('ui-tabs')) customElements.define('ui-tabs', UiTabs);
