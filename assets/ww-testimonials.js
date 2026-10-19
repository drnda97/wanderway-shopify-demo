/**
 * Wander Way demo – <ww-testimonials>
 * Shows `visible` slides starting at the current index and advances by one,
 * wrapping at both ends. Grid layout shows 3 from 750px up, 1 below; the
 * single layout always shows 1. Arrow keys work when the track has focus.
 */
if (!customElements.get('ww-testimonials')) {
  customElements.define(
    'ww-testimonials',
    class WWTestimonials extends HTMLElement {
      connectedCallback() {
        this.slides = Array.from(this.querySelectorAll('[data-ww-slide]'));
        this.index = 0;
        if (this.slides.length < 2) return;

        this.current = this.querySelector('[data-ww-current]');
        this.track = this.querySelector('[data-ww-track]');
        this.mql = window.matchMedia('(min-width: 750px)');

        this.querySelector('[data-ww-prev]').addEventListener('click', () => this.go(-1));
        this.querySelector('[data-ww-next]').addEventListener('click', () => this.go(1));
        this.track.addEventListener('keydown', this.onKeydown);
        this.mql.addEventListener('change', this.render);
        this.render();
      }

      disconnectedCallback() {
        this.mql?.removeEventListener('change', this.render);
      }

      get visible() {
        if (this.dataset.layout !== 'grid' || !this.mql.matches) return 1;
        return Math.min(3, this.slides.length);
      }

      onKeydown = (event) => {
        if (event.key === 'ArrowRight') this.go(1);
        if (event.key === 'ArrowLeft') this.go(-1);
      };

      go(step) {
        const count = this.slides.length;
        this.index = (this.index + step + count) % count;
        this.render();
      }

      render = () => {
        const count = this.slides.length;
        const shown = this.visible;

        this.slides.forEach((slide) => (slide.hidden = true));
        for (let i = 0; i < shown; i += 1) {
          const slide = this.slides[(this.index + i) % count];
          slide.hidden = false;
          slide.style.order = i;
        }

        if (this.current) this.current.textContent = String(this.index + 1).padStart(2, '0');
        this.querySelectorAll('.ww-testimonials__dots--controls .ww-testimonials__dot').forEach((dot, i) => {
          dot.classList.toggle('is-active', i === this.index);
        });
      };
    }
  );
}
