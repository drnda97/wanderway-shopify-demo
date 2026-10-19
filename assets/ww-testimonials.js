/**
 * Wander Way demo - <ww-testimonials>
 * Prev/next buttons for a CSS scroll-snap track; buttons disable at the ends.
 */
if (!customElements.get('ww-testimonials')) {
  customElements.define(
    'ww-testimonials',
    class WWTestimonials extends HTMLElement {
      connectedCallback() {
        this.track = this.querySelector('[data-ww-track]');
        this.prev = this.querySelector('[data-ww-prev]');
        this.next = this.querySelector('[data-ww-next]');
        if (!this.track) return;

        this.prev.addEventListener('click', () => this.go(-1));
        this.next.addEventListener('click', () => this.go(1));
        this.track.addEventListener('scroll', () => this.updateButtons(), { passive: true });
        this.track.addEventListener('keydown', (event) => {
          if (event.key === 'ArrowRight') this.go(1);
          if (event.key === 'ArrowLeft') this.go(-1);
        });

        this.resizeObserver = new ResizeObserver(() => this.updateButtons());
        this.resizeObserver.observe(this.track);
        this.updateButtons();
      }

      disconnectedCallback() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
      }

      get step() {
        const slide = this.track.querySelector('li');
        if (!slide) return this.track.clientWidth;
        const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
        return slide.getBoundingClientRect().width + gap;
      }

      go(direction) {
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.track.scrollBy({ left: direction * this.step, behavior: reduce ? 'auto' : 'smooth' });
      }

      updateButtons() {
        const max = this.track.scrollWidth - this.track.clientWidth - 2;
        this.prev.disabled = this.track.scrollLeft <= 2;
        this.next.disabled = this.track.scrollLeft >= max;
        this.querySelector('.ww-testimonials__nav').hidden = max <= 0;
      }
    }
  );
}
