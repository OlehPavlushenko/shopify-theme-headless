/**
 * <drill-menu> — mobile menu with drill-down panels (one level per screen).
 *
 * Markup contract:
 * - panels: elements with [data-panel="<id>"]; the root panel has data-panel="root"
 * - [data-panel-open="<id>"] shows that panel, [data-panel-back] returns to the parent panel
 * Panels other than the active one are `hidden` and `inert`; focus moves to the first focusable
 * element of the panel that opens. Resets to the root panel when the surrounding <dialog> or popover closes.
 */
class DrillMenu extends HTMLElement {
  #stack = ['root'];

  connectedCallback() {
    this.addEventListener('click', this.#onClick);
    // Back to the root panel whenever the surrounding dialog or popover closes
    this.closest('dialog')?.addEventListener('close', () => this.#show('root', true));
    this.closest('[popover]')?.addEventListener('toggle', (event) => {
      if (event.newState === 'closed') this.#show('root', true);
    });
  }

  #onClick = (event) => {
    const opener = event.target.closest('[data-panel-open]');
    if (opener) {
      event.preventDefault();
      this.#stack.push(opener.dataset.panelOpen);
      this.#show(opener.dataset.panelOpen);
      return;
    }
    if (event.target.closest('[data-panel-back]')) {
      event.preventDefault();
      const from = this.#stack.pop();
      this.#show(this.#stack.at(-1) ?? 'root', false, from);
    }
  };

  #show(id, reset = false, returnFrom = null) {
    if (reset) this.#stack = ['root'];
    for (const panel of this.querySelectorAll('[data-panel]')) {
      const active = panel.dataset.panel === id;
      panel.hidden = !active;
      panel.inert = !active;
      panel.toggleAttribute('data-entering', active && !reset);
    }
    if (reset) return;
    const target = returnFrom
      ? this.querySelector(`[data-panel-open="${CSS.escape(returnFrom)}"]`)
      : this.querySelector(`[data-panel="${CSS.escape(id)}"] :is(a, button)`);
    target?.focus({ preventScroll: true });
  }
}

if (!customElements.get('drill-menu')) customElements.define('drill-menu', DrillMenu);
