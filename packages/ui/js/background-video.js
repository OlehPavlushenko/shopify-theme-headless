/**
 * <background-video> — muted looping video behind content (hero slides).
 *
 * Markup contract: <background-video> <video muted loop playsinline preload="none" poster="…"> … </video>
 * [<video class="… --mobile">] </background-video>; CSS shows one video per screen size.
 * The poster shows first; the visible video starts after the page has loaded, plays only while on
 * screen (pauses in hidden slides and off screen), and never starts with "reduce motion" or
 * Data Saver — the poster stays then.
 */
const allowed = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData;

class BackgroundVideo extends HTMLElement {
  #observer;

  connectedCallback() {
    if (!allowed()) return;
    const start = () => {
      this.#observer = new IntersectionObserver(([entry]) => this.#toggle(entry.isIntersecting), { threshold: 0.25 });
      this.#observer.observe(this);
    };
    if (document.readyState === 'complete') start();
    else addEventListener('load', start, { once: true });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  #toggle(visible) {
    for (const video of this.querySelectorAll('video')) {
      const shown = getComputedStyle(video).display !== 'none';
      if (visible && shown) {
        video.preload = 'auto';
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }
}

if (!customElements.get('background-video')) customElements.define('background-video', BackgroundVideo);
