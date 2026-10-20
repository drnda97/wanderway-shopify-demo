/**
 * Wander Way demo – <ww-card-swatches>
 * Swaps a product card to another colour: image + srcset, tint, colour labels
 * and the ?variant= links. Variant data is rendered by Liquid as data-
 * attributes on each swatch button, so no requests are made.
 *
 * The new photo is preloaded on swatch hover/focus, decoded off-screen and
 * then revealed over the old one (fade + slight zoom-out); the old photo is
 * only removed once the new one covers it. Last click wins.
 */
if (!customElements.get('ww-card-swatches')) {
  const EASE = 'cubic-bezier(.2, .7, .2, 1)';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  customElements.define(
    'ww-card-swatches',
    class WWCardSwatches extends HTMLElement {
      connectedCallback() {
        this.token = 0;
        this.addEventListener('click', this.onClick);
        this.addEventListener('pointerover', this.onIntent);
        this.addEventListener('focusin', this.onIntent);
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.removeEventListener('pointerover', this.onIntent);
        this.removeEventListener('focusin', this.onIntent);
      }

      get image() {
        return this.querySelector('[data-ww-card-img]');
      }

      onIntent = (event) => {
        const swatch = event.target.closest('.ww-card__swatch');
        if (!swatch || swatch.dataset.preloaded || !swatch.dataset.src) return;
        swatch.dataset.preloaded = 'true';
        const img = new Image();
        img.sizes = this.image?.sizes || '';
        if (swatch.dataset.srcset) img.srcset = swatch.dataset.srcset;
        img.src = swatch.dataset.src;
      };

      onClick = (event) => {
        const swatch = event.target.closest('.ww-card__swatch');
        if (!swatch || swatch.getAttribute('aria-pressed') === 'true') return;
        this.select(swatch);
      };

      select(swatch) {
        const { colour, handle, url, src, srcset } = swatch.dataset;
        const token = ++this.token;

        this.querySelectorAll('.ww-card__swatch').forEach((button) => {
          button.setAttribute('aria-pressed', String(button === swatch));
        });
        this.style.setProperty('--ww-card-tint', `var(--ww-tint-${handle}, var(--ww-surface-2))`);
        this.swapLabels(colour, swatch.style.getPropertyValue('--ww-dot'));
        if (url) this.querySelectorAll('[data-ww-card-link]').forEach((link) => (link.href = url));

        const current = this.image;
        if (!current || !src || current.currentSrc.split('?')[0] === src.split('?')[0]) {
          if (current) current.alt = this.altFor(current, colour);
          return;
        }
        this.swapImage(current, { src, srcset, colour }, token);
      }

      altFor(img, colour) {
        return `${img.alt.replace(/ in .*$/, '')} in ${colour}`;
      }

      async swapImage(current, { src, srcset, colour }, token) {
        // Drop a previous swap that hasn't finished yet.
        this.querySelectorAll('.ww-card__img--incoming').forEach((img) => img !== current && img.remove());

        if (reducedMotion.matches) {
          if (srcset) current.srcset = srcset;
          current.src = src;
          current.alt = this.altFor(current, colour);
          return;
        }

        const incoming = current.cloneNode(false);
        incoming.removeAttribute('data-ww-card-img');
        incoming.classList.add('ww-card__img--incoming');
        incoming.loading = 'eager';
        incoming.alt = this.altFor(current, colour);
        if (srcset) incoming.srcset = srcset;
        incoming.src = src;
        incoming.style.opacity = '0';
        current.after(incoming);

        try {
          await incoming.decode();
        } catch (error) {
          /* decode can reject for cached/odd images; reveal anyway */
        }
        if (token !== this.token) {
          incoming.remove();
          return;
        }

        // End on whatever transform the card currently has (hover zoom).
        const resting = getComputedStyle(current).transform;
        const end = resting === 'none' ? 'scale(1)' : resting;
        incoming.style.opacity = '';
        const reveal = incoming.animate(
          [
            { opacity: 0, transform: 'scale(1.06)', filter: 'saturate(.6)' },
            { opacity: 1, transform: end, filter: 'saturate(1)' },
          ],
          { duration: 620, easing: EASE }
        );
        current.animate([{ transform: end }, { transform: 'scale(1.02)' }], { duration: 620, easing: EASE });

        await reveal.finished.catch(() => {});
        if (token !== this.token) return;

        incoming.classList.remove('ww-card__img--incoming');
        incoming.setAttribute('data-ww-card-img', '');
        current.remove();
      }

      swapLabels(colour, dot) {
        this.querySelectorAll('[data-ww-card-dot]').forEach((el) => el.style.setProperty('--ww-dot', dot));
        this.querySelectorAll('[data-ww-card-colour]').forEach((el) => {
          if (el.textContent === colour) return;
          el.textContent = colour;
          if (!reducedMotion.matches) {
            el.animate(
              [
                { opacity: 0, transform: 'translateY(4px)' },
                { opacity: 1, transform: 'none' },
              ],
              { duration: 320, easing: EASE }
            );
          }
        });
      }
    }
  );
}
