/**
 * Wander Way demo – product page enhancements on top of Dawn's main-product.
 *
 * <ww-product-extras data-section data-price data-money-format data-separator>
 *   - "Add to cart · €148": price × quantity, follows quantity and variant
 *   - gallery overlay: view label ("Black · Front"), "1 / 4" counter, mobile dots
 *   - accordion rows marked "open on desktop" start closed below 750px
 *
 * <ww-sticky-atc data-section>
 *   Mobile bar that appears once the main Add to cart button has scrolled
 *   out of view; its button clicks the real one so Dawn's form handles it.
 */
(() => {
  const formatMoney = (cents, format) =>
    window.WWShipping ? window.WWShipping.formatMoney(cents, format) : (cents / 100).toFixed(2);
  const onVariantChange = (sectionId, callback) => {
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return null;
    return subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
      if (event?.data?.sectionId === sectionId) callback(event.data.variant);
    });
  };
  const mobile = window.matchMedia('(max-width: 749px)');

  if (!customElements.get('ww-product-extras')) {
    customElements.define(
      'ww-product-extras',
      class WWProductExtras extends HTMLElement {
        connectedCallback() {
          this.sectionId = this.dataset.section;
          this.root = document.getElementById(`MainProduct-${this.sectionId}`);
          if (!this.root) return;
          this.price = Number(this.dataset.price);
          this.available = true;

          this.setUpAddToCartPrice();
          this.setUpGallery();
          if (mobile.matches) {
            this.root.querySelectorAll('.ww-accordion[data-desktop-open]').forEach((details) => (details.open = false));
          }

          this.unsubscribe = onVariantChange(this.sectionId, (variant) => {
            this.available = Boolean(variant?.available);
            if (variant) this.price = variant.price;
            this.renderAddToCartPrice();
            window.requestAnimationFrame(() => this.renderGallery());
          });
        }

        disconnectedCallback() {
          this.unsubscribe?.();
          this.galleryObserver?.disconnect();
        }

        /* ---- Add to cart · €148 ---- */
        setUpAddToCartPrice() {
          if (!this.dataset.separator) return;
          this.button = this.root.querySelector(`#ProductSubmitButton-${this.sectionId}`);
          this.quantity = this.root.querySelector(`#Quantity-${this.sectionId}`);
          if (!this.button) return;
          this.priceLabel = document.createElement('span');
          this.priceLabel.className = 'ww-atc-price';
          this.button.querySelector(':scope > span')?.after(this.priceLabel);
          this.quantity?.addEventListener('change', () => this.renderAddToCartPrice());
          this.quantity?.addEventListener('input', () => this.renderAddToCartPrice());
          this.renderAddToCartPrice();
        }

        renderAddToCartPrice() {
          if (!this.priceLabel) return;
          const quantity = Math.max(1, parseInt(this.quantity?.value, 10) || 1);
          const show = this.available && !this.button.disabled;
          this.priceLabel.hidden = !show;
          // non-breaking spaces: a leading space would collapse inside the flex button
          const separator = this.dataset.separator.replace(/ /g, '\u00a0');
          this.priceLabel.textContent = `${separator}${formatMoney(this.price * quantity, this.dataset.moneyFormat)}`;
        }

        /* ---- Gallery overlay ---- */
        setUpGallery() {
          this.viewer = this.root.querySelector(`#GalleryViewer-${this.sectionId}`);
          if (!this.viewer) return;
          this.viewer.classList.add('ww-gallery');
          this.overlay = document.createElement('div');
          this.overlay.className = 'ww-gallery__overlay';
          this.overlay.setAttribute('aria-hidden', 'true');
          this.overlay.innerHTML =
            '<span class="ww-pill ww-gallery__label"></span><span class="ww-pill ww-gallery__count"></span><span class="ww-gallery__dots"></span>';
          this.viewer.append(this.overlay);
          this.page = 1;

          this.viewer.addEventListener('slideChanged', (event) => {
            this.page = event.detail?.currentPage || 1;
            this.renderGallery();
          });
          this.galleryObserver = new MutationObserver(() => this.renderGallery());
          this.galleryObserver.observe(this.viewer.querySelector('.product__media-list'), {
            attributes: true,
            attributeFilter: ['class'],
            subtree: true,
            childList: true,
          });
          mobile.addEventListener('change', () => this.renderGallery());
          this.renderGallery();
        }

        renderGallery() {
          if (!this.overlay) return;
          const items = Array.from(this.viewer.querySelectorAll('.product__media-item')).filter(
            (item) => item.offsetParent !== null || item.classList.contains('is-active')
          );
          if (!items.length) return;

          let index = items.findIndex((item) => item.classList.contains('is-active'));
          if (mobile.matches) index = Math.min(this.page, items.length) - 1;
          index = Math.max(0, index);

          const img = items[index].querySelector('img');
          const label = (img?.alt || '').split(' – ').pop();
          this.overlay.querySelector('.ww-gallery__label').textContent = label;
          this.overlay.querySelector('.ww-gallery__label').hidden = !label;
          this.overlay.querySelector('.ww-gallery__count').textContent = `${index + 1} / ${items.length}`;
          this.overlay.querySelector('.ww-gallery__dots').replaceChildren(
            ...items.map((_, i) => {
              const dot = document.createElement('span');
              if (i === index) dot.className = 'is-active';
              return dot;
            })
          );
        }
      }
    );
  }

  if (!customElements.get('ww-sticky-atc')) {
    customElements.define(
      'ww-sticky-atc',
      class WWStickyAtc extends HTMLElement {
        connectedCallback() {
          this.sectionId = this.dataset.section;
          this.target = document.getElementById(`ProductSubmitButton-${this.sectionId}`);
          if (!this.target) return;

          this.querySelector('[data-ww-sticky-add]').addEventListener('click', () => this.target.click());
          this.observer = new IntersectionObserver(([entry]) => {
            this.hidden = entry.isIntersecting || entry.boundingClientRect.top > 0;
          });
          this.observer.observe(this.target);

          this.unsubscribe = onVariantChange(this.sectionId, (variant) => {
            if (!variant) return;
            const colour = this.querySelector('[data-ww-sticky-colour]');
            const colourIndex = Number(this.dataset.colourIndex);
            if (colour && colourIndex >= 0) colour.textContent = variant.options[colourIndex];
            const price = this.querySelector('[data-ww-sticky-price]');
            const extras = document.querySelector(`ww-product-extras[data-section="${this.sectionId}"]`);
            if (price) price.textContent = formatMoney(variant.price, extras?.dataset.moneyFormat);
            const img = this.querySelector('[data-ww-sticky-img]');
            if (img && variant.featured_image?.src) {
              img.srcset = '';
              img.src = `${variant.featured_image.src}${variant.featured_image.src.includes('?') ? '&' : '?'}width=120`;
            }
            this.querySelector('[data-ww-sticky-add]').disabled = !variant.available;
          });
        }

        disconnectedCallback() {
          this.observer?.disconnect();
          this.unsubscribe?.();
        }
      }
    );
  }
})();
