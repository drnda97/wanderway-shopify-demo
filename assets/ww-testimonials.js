/**
 * Wander Way demo – <ww-testimonials>
 * Shows `visible` slides starting at the current index and advances by one,
 * wrapping at both ends. Grid layout shows 3 from 750px up, 1 below; the
 * single layout always shows 1. Arrow keys work when the track has focus.
 *
 * Transitions (Web Animations API, skipped for prefers-reduced-motion):
 * cards that stay visible glide to their new slot (FLIP), the card that
 * leaves slides out and fades, the new card slides in from the side the
 * user is moving towards.
 */
if (!customElements.get('ww-testimonials')) {
  const EASE = 'cubic-bezier(.2, .7, .2, 1)';
  const DURATION = 560;
  const SHIFT = 48; // px the leaving / entering card travels

  customElements.define(
    'ww-testimonials',
    class WWTestimonials extends HTMLElement {
      connectedCallback() {
        this.slides = Array.from(this.querySelectorAll('[data-ww-slide]'));
        this.index = 0;
        this.running = [];
        if (this.slides.length < 2) return;

        this.current = this.querySelector('[data-ww-current]');
        this.track = this.querySelector('[data-ww-track]');
        this.mql = window.matchMedia('(min-width: 750px)');
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        this.querySelector('[data-ww-prev]').addEventListener('click', () => this.go(-1));
        this.querySelector('[data-ww-next]').addEventListener('click', () => this.go(1));
        this.track.addEventListener('keydown', this.onKeydown);
        this.mql.addEventListener('change', this.onResize);
        this.render();
      }

      disconnectedCallback() {
        this.mql?.removeEventListener('change', this.onResize);
      }

      get visible() {
        if (this.dataset.layout !== 'grid' || !this.mql.matches) return 1;
        return Math.min(3, this.slides.length);
      }

      onKeydown = (event) => {
        if (event.key === 'ArrowRight') this.go(1);
        if (event.key === 'ArrowLeft') this.go(-1);
      };

      onResize = () => {
        this.finishRunning();
        this.render();
      };

      go(step) {
        const count = this.slides.length;
        this.finishRunning();

        const before = this.visibleSlides();
        const firstRects = new Map(before.map((slide) => [slide, slide.getBoundingClientRect()]));

        this.index = (this.index + step + count) % count;
        this.render();

        if (!this.reducedMotion.matches) this.animate(step, before, firstRects);
      }

      visibleSlides() {
        return this.slides.filter((slide) => !slide.hidden);
      }

      render() {
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
      }

      animate(step, before, firstRects) {
        const after = this.visibleSlides();
        const direction = step > 0 ? 1 : -1;
        const trackRect = this.track.getBoundingClientRect();

        // 1. Cards that stay visible: glide from their old slot to the new one.
        after
          .filter((slide) => firstRects.has(slide))
          .forEach((slide) => {
            const dx = firstRects.get(slide).left - slide.getBoundingClientRect().left;
            if (!dx) return;
            this.track$(slide.animate([{ transform: `translateX(${dx}px)` }, { transform: 'none' }], { duration: DURATION, easing: EASE }));
          });

        // 2. Cards that left: a frozen copy slides out and fades where the card was.
        before
          .filter((slide) => slide.hidden)
          .forEach((slide) => {
            const rect = firstRects.get(slide);
            const ghost = slide.cloneNode(true);
            ghost.hidden = false;
            ghost.removeAttribute('id');
            ghost.removeAttribute('data-ww-slide');
            ghost.setAttribute('aria-hidden', 'true');
            ghost.inert = true;
            ghost.classList.add('ww-review--ghost');
            Object.assign(ghost.style, {
              left: `${rect.left - trackRect.left}px`,
              top: `${rect.top - trackRect.top}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
            });
            this.track.append(ghost);
            const out = ghost.animate(
              [
                { opacity: 1, transform: 'none' },
                { opacity: 0, transform: `translateX(${-direction * SHIFT}px) scale(.96)` },
              ],
              { duration: DURATION * 0.7, easing: EASE, fill: 'forwards' }
            );
            out.finished.then(() => ghost.remove()).catch(() => ghost.remove());
            this.track$(out);
          });

        // 3. Cards that arrived: slide in from the side we're moving towards.
        after
          .filter((slide) => !firstRects.has(slide))
          .forEach((slide) => {
            this.track$(
              slide.animate(
                [
                  { opacity: 0, transform: `translateX(${direction * SHIFT}px) scale(.96)` },
                  { opacity: 1, transform: 'none' },
                ],
                { duration: DURATION, delay: DURATION * 0.18, easing: EASE, fill: 'backwards' }
              )
            );
          });

        // 4. Pager number ticks in the same direction.
        if (this.current) {
          this.track$(
            this.current.animate(
              [
                { opacity: 0, transform: `translateY(${direction * 6}px)` },
                { opacity: 1, transform: 'none' },
              ],
              { duration: DURATION * 0.6, easing: EASE }
            )
          );
        }
      }

      track$(animation) {
        this.running.push(animation);
        animation.finished
          .catch(() => {})
          .then(() => {
            this.running = this.running.filter((item) => item !== animation);
          });
      }

      /** Jump running transitions to their end, so fast clicks never stack. */
      finishRunning() {
        this.running.forEach((animation) => {
          try {
            animation.finish();
          } catch (error) {
            animation.cancel();
          }
        });
        this.running = [];
        this.querySelectorAll('.ww-review--ghost').forEach((ghost) => ghost.remove());
      }
    }
  );
}
