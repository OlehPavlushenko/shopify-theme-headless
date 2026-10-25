/* Generated from packages/ui/js/background-video.js by scripts/sync-ui.mjs. Do not edit here. */
/**
 * <background-video> — muted looping video behind content (hero slides).
 *
 * Markup contract: <background-video [data-start="<s>"] [data-end="<s>"]>
 *   <video muted loop playsinline preload="none" poster="…"> … </video> [<video class="… --mobile">]
 * </background-video>; CSS shows one video per screen size and hides the slide image while a video
 * is in use.
 * Always muted, looping, without controls. Nothing loads before the page has: then a video starts
 * loading only once it is on screen (a video on a later slide waits until that slide is shown), shows
 * its frame at data-start ([data-ready]) — no first-frame poster, no jump — and plays while on screen
 * (pauses in hidden slides and off screen). Decoding runs off the page's main thread.
 * With "reduce motion" or Data Saver it never plays: [data-off] is set, the slide image shows instead
 * (or the video poster when the slide has no image).
 * data-start / data-end: play only that part of the video and loop it.
 */
const allowed = () =>
  !matchMedia('(prefers-reduced-motion: reduce)').matches && !navigator.connection?.saveData;

const shown = (video) => getComputedStyle(video).display !== 'none';

class BackgroundVideo extends HTMLElement {
  #observer;

  connectedCallback() {
    this.videos = [...this.querySelectorAll('video')];
    if (!allowed()) {
      this.setAttribute('data-off', '');
      return;
    }
    this.start = Number(this.dataset.start) || 0;
    this.end = Number(this.dataset.end) || 0;
    for (const video of this.videos) this.#segment(video);

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

  // Load the frame at data-start and show the video with it
  #prepare(video) {
    if (video.dataset.prepared) return;
    video.dataset.prepared = 'true';
    const ready = () => video.setAttribute('data-ready', '');
    if (this.start) {
      video.addEventListener('loadedmetadata', () => (video.currentTime = this.start), { once: true });
      video.addEventListener('seeked', ready, { once: true });
    } else {
      video.addEventListener('loadeddata', ready, { once: true });
    }
    video.preload = 'auto';
    video.load();
  }

  // Loop data-start … data-end (or to the end of the file)
  #segment(video) {
    if (!this.start && !this.end) return;
    video.loop = false;
    video.addEventListener('timeupdate', () => {
      if (this.end && video.currentTime >= this.end) video.currentTime = this.start;
    });
    video.addEventListener('ended', () => {
      video.currentTime = this.start;
      video.play().catch(() => {});
    });
  }

  #toggle(visible) {
    for (const video of this.videos) {
      if (visible && shown(video)) {
        this.#prepare(video);
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    }
  }
}

if (!customElements.get('background-video')) customElements.define('background-video', BackgroundVideo);
