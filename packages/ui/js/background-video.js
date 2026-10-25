/**
 * <background-video> — muted looping video behind content (hero slides).
 *
 * Markup contract: <background-video [data-start="<s>"] [data-end="<s>"]>
 *   <video muted loop playsinline preload="none" poster="…"> … </video> [<video class="… --mobile">]
 * </background-video>; CSS shows one video per screen size.
 * Always muted, looping and without controls. The poster shows first; the visible video starts after
 * the page has loaded, plays only while on screen (pauses in hidden slides and off screen), and never
 * starts with "reduce motion" or Data Saver — the poster stays then.
 * data-start / data-end: play only that part of the video and loop it.
 */
const allowed = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData;

class BackgroundVideo extends HTMLElement {
  #observer;

  connectedCallback() {
    if (!allowed()) return;
    this.start = Number(this.dataset.start) || 0;
    this.end = Number(this.dataset.end) || 0;
    for (const video of this.querySelectorAll('video')) this.#segment(video);

    const begin = () => {
      this.#observer = new IntersectionObserver(([entry]) => this.#toggle(entry.isIntersecting), { threshold: 0.25 });
      this.#observer.observe(this);
    };
    if (document.readyState === 'complete') begin();
    else addEventListener('load', begin, { once: true });
  }

  disconnectedCallback() {
    this.#observer?.disconnect();
  }

  // Start at data-start; at data-end (or the end of the file) jump back to data-start
  #segment(video) {
    if (!this.start && !this.end) return;
    video.loop = false;
    video.addEventListener('loadedmetadata', () => (video.currentTime = this.start));
    video.addEventListener('timeupdate', () => {
      if (this.end && video.currentTime >= this.end) video.currentTime = this.start;
    });
    video.addEventListener('ended', () => {
      video.currentTime = this.start;
      video.play().catch(() => {});
    });
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
