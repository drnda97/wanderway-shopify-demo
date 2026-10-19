/**
 * Wander Way demo – <ww-card-swatches>
 * Swaps a product card to another colour: image + srcset, tint, colour labels
 * and the ?variant= links. Variant data is rendered by Liquid as data-
 * attributes on each swatch button, so no requests are made.
 */
if (!customElements.get('ww-card-swatches')) {
  customElements.define(
    'ww-card-swatches',
    class WWCardSwatches extends HTMLElement {
      connectedCallback() {
        this.addEventListener('click', this.onClick);
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
      }

      onClick = (event) => {
        const swatch = event.target.closest('.ww-card__swatch');
        if (!swatch || swatch.getAttribute('aria-pressed') === 'true') return;
        this.select(swatch);
      };

      select(swatch) {
        const { colour, handle, url, src, srcset } = swatch.dataset;

        this.querySelectorAll('.ww-card__swatch').forEach((button) => {
          button.setAttribute('aria-pressed', String(button === swatch));
        });

        const img = this.querySelector('[data-ww-card-img]');
        if (img && src) {
          if (srcset) img.srcset = srcset;
          img.src = src;
          img.alt = img.alt.replace(/ in .*$/, '') + ` in ${colour}`;
        }

        this.style.setProperty('--ww-card-tint', `var(--ww-tint-${handle}, var(--ww-surface-2))`);
        this.querySelectorAll('[data-ww-card-colour]').forEach((el) => (el.textContent = colour));
        this.querySelectorAll('[data-ww-card-dot]').forEach((el) =>
          el.style.setProperty('--ww-dot', swatch.style.getPropertyValue('--ww-dot'))
        );
        if (url) this.querySelectorAll('[data-ww-card-link]').forEach((link) => (link.href = url));
      }
    }
  );
}
