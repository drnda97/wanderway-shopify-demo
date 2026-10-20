/**
 * Wander Way demo – product page enhancements on top of Dawn's main-product.
 *
 * <ww-product-extras data-section data-price data-money-format data-separator>
 *   - "Add to cart · €148": price × quantity, follows quantity and variant
 *   - gallery overlay: view label ("Black · Front"), "1 / 4" counter, mobile dots
 *   - accordion rows marked "open on desktop" start closed below 750px
 *   - colour change transition: on PUB_SUB_EVENTS.optionValueSelectionChange
 *     (the click, before Dawn fetches the new variant) the current photo is
 *     frozen as an overlay; on variantChange (after Dawn swapped the media)
 *     the overlay fades out over the new, decoded photo, which settles from a
 *     slight zoom. The buy-box values that changed slide in, staggered.
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
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const EASE = 'cubic-bezier(.2, .7, .2, 1)';

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
            window.requestAnimationFrame(() => {
              this.renderGallery();
              this.revealGallery();
              this.animateBuyBox();
            });
          });
          if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            this.unsubscribeSelection = subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, ({ data }) => {
              if (this.root.contains(data?.event?.target)) this.freezeGallery();
            });
          }
        }

        disconnectedCallback() {
          this.unsubscribe?.();
          this.unsubscribeSelection?.();
          this.galleryObserver?.disconnect();
        }

        /* ---- Colour change transition ---- */
        activeMedia() {
          if (!this.viewer) return null;
          if (mobile.matches) {
            const items = Array.from(this.viewer.querySelectorAll('.product__media-item')).filter((item) => item.offsetParent);
            return items[Math.min(this.page, items.length) - 1] || items[0];
          }
          return this.viewer.querySelector('.product__media-item.is-active');
        }

        /** Freeze the current photo on top while Dawn fetches the new variant. */
        freezeGallery() {
          if (reducedMotion.matches || !this.viewer) return;
          this.ghost?.remove();
          const media = this.activeMedia();
          const frame = media?.querySelector('.product-media-container');
          const img = frame?.querySelector('img');
          if (!img) return;

          const viewerRect = this.viewer.getBoundingClientRect();
          const rect = frame.getBoundingClientRect();
          const ghost = document.createElement('div');
          ghost.className = 'ww-gallery__ghost';
          ghost.setAttribute('aria-hidden', 'true');
          Object.assign(ghost.style, {
            left: `${rect.left - viewerRect.left}px`,
            top: `${rect.top - viewerRect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            borderRadius: getComputedStyle(frame).borderRadius,
          });
          const copy = new Image();
          copy.alt = '';
          copy.src = img.currentSrc || img.src;
          ghost.append(copy);
          this.viewer.append(ghost);
          this.ghost = ghost;
          // Safety net: never leave the overlay if no variantChange follows.
          window.clearTimeout(this.ghostTimer);
          this.ghostTimer = window.setTimeout(() => this.dropGhost(), 4000);
        }

        dropGhost() {
          const ghost = this.ghost;
          this.ghost = null;
          if (!ghost) return;
          ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: EASE }).finished.finally(() => ghost.remove());
        }

        async revealGallery() {
          const ghost = this.ghost;
          if (!ghost) return;
          window.clearTimeout(this.ghostTimer);
          const img = this.activeMedia()?.querySelector('.product-media-container img');
          if (img) {
            try {
              await img.decode();
            } catch (error) {
              /* reveal anyway */
            }
          }
          if (ghost !== this.ghost) return;
          this.ghost = null;
          if (img && img.currentSrc !== ghost.querySelector('img').src) {
            img.animate([{ transform: 'scale(1.05)', filter: 'saturate(.7)' }, { transform: 'none', filter: 'none' }], {
              duration: 700,
              easing: EASE,
            });
          }
          ghost
            .animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.985)' }], { duration: 520, easing: EASE, fill: 'forwards' })
            .finished.finally(() => ghost.remove());

          const firstThumb = this.root.querySelector('.thumbnail-list__item:not([hidden]) .thumbnail');
          firstThumb?.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], {
            duration: 480,
            easing: EASE,
          });
        }

        /** The values that change with the colour slide in, one after the other. */
        animateBuyBox() {
          if (reducedMotion.matches) return;
          const targets = [
            this.root.querySelector('.ww-option-value'),
            this.root.querySelector(`#price-${this.sectionId} .ww-pdp-heading__amount`),
            this.priceLabel,
            this.root.querySelector(`#Inventory-${this.sectionId}`),
          ].filter(Boolean);
          targets.forEach((el, i) => {
            if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
            el.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], {
              duration: 380,
              delay: i * 45,
              easing: EASE,
              fill: 'backwards',
            });
          });
          this.root
            .querySelector('.product-form__input--pill input:checked + label')
            ?.animate([{ transform: 'scale(.96)' }, { transform: 'scale(1.02)', offset: 0.6 }, { transform: 'none' }], {
              duration: 380,
              easing: EASE,
            });
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
          // Desktop shows one media at a time; the visible thumbnails are the real list.
          const thumbnails = Array.from(this.root.querySelectorAll('.thumbnail-list__item')).filter(
            (item) => item.offsetParent !== null
          );
          const media = Array.from(this.viewer.querySelectorAll('.product__media-item')).filter(
            (item) => item.offsetParent !== null || item.classList.contains('is-active')
          );
          const useThumbnails = !mobile.matches && thumbnails.length > 0;
          const count = useThumbnails ? thumbnails.length : media.length;
          if (!count) return;

          let index = useThumbnails
            ? thumbnails.findIndex((item) => item.querySelector('[aria-current]'))
            : media.findIndex((item) => item.classList.contains('is-active'));
          if (mobile.matches) index = Math.min(this.page, count) - 1;
          index = Math.max(0, index);

          const active = this.viewer.querySelector('.product__media-item.is-active') || media[index];
          const img = (mobile.matches ? media[index] : active)?.querySelector('img');
          const label = (img?.alt || '').split(' – ').pop();
          this.overlay.querySelector('.ww-gallery__label').textContent = label;
          this.overlay.querySelector('.ww-gallery__label').hidden = !label;
          this.overlay.querySelector('.ww-gallery__count').textContent = `${index + 1} / ${count}`;
          this.overlay.querySelector('.ww-gallery__dots').replaceChildren(
            ...Array.from({ length: count }, (_, i) => {
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
