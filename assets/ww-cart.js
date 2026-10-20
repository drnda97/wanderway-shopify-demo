/**
 * Wander Way demo – cart drawer helpers.
 *
 * <ww-cart-upsell data-variant-id>
 *   "Add" posts to /cart/add.js asking for the drawer sections, then hands the
 *   response to Dawn's <cart-drawer>.renderContents() and publishes
 *   PUB_SUB_EVENTS.cartUpdate like Dawn's product form does.
 *
 * <ww-cart-shipping data-zones data-free data-subtotal ...>
 *   Shows the shipping estimate for the zone picked in the delivery estimate
 *   (localStorage, first zone by default) and adds it to the checkout total.
 *
 * Drawer motion (Dawn re-renders the drawer markup after every change, so
 * CSS transitions alone never run): staggered entrance on open, the
 * free-shipping bar grows from its previous width, changed amounts tick in,
 * and a removed line slides out as soon as Remove is clicked.
 */
if (!customElements.get('ww-cart-upsell')) {
  customElements.define(
    'ww-cart-upsell',
    class WWCartUpsell extends HTMLElement {
      connectedCallback() {
        this.button = this.querySelector('button');
        this.button?.addEventListener('click', () => this.add());
      }

      async add() {
        const drawer = document.querySelector('cart-drawer');
        this.button.disabled = true;
        this.setAttribute('aria-busy', 'true');
        try {
          const response = await fetch(`${window.routes.cart_add_url}.js`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              items: [{ id: Number(this.dataset.variantId), quantity: 1 }],
              sections: drawer.getSectionsToRender().map((section) => section.id),
              sections_url: window.location.pathname,
            }),
          });
          const state = await response.json();
          if (!response.ok || state.status) throw new Error(state.description || state.message);

          drawer.classList.remove('is-empty');
          drawer.renderContents({ ...state, id: Number(this.dataset.variantId) });
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, { source: 'ww-cart-upsell', productVariantId: this.dataset.variantId, cartData: state });
          }
        } catch (error) {
          const errors = document.getElementById('CartDrawer-CartErrors');
          if (errors) errors.textContent = error.message || window.cartStrings?.error || '';
          this.button.disabled = false;
          this.removeAttribute('aria-busy');
        }
      }
    }
  );
}

if (!customElements.get('ww-cart-shipping')) {
  customElements.define(
    'ww-cart-shipping',
    class WWCartShipping extends HTMLElement {
      connectedCallback() {
        this.render();
      }

      /** "€4.90" / "4,90 €" -> 490 */
      static toCents(price) {
        const number = String(price).replace(/[^\d.,]/g, '');
        const normalised = /,\d{1,2}$/.test(number) ? number.replace(/\./g, '').replace(',', '.') : number.replace(/,/g, '');
        return Math.round(parseFloat(normalised || '0') * 100);
      }

      render() {
        const value = this.querySelector('[data-ww-shipping-value]');
        const total = this.closest('.drawer__inner')?.querySelector('[data-ww-checkout-total]');
        const subtotal = Number(this.dataset.subtotal) || 0;
        if (!value || !window.WWShipping) return;

        if (subtotal === 0) return;
        if (this.dataset.free === 'true') {
          value.textContent = this.dataset.freeLabel;
          return;
        }
        const zones = WWShipping.parseZones(this.dataset.zones);
        if (!zones.length) {
          this.hidden = true;
          return;
        }
        const zone = zones[WWShipping.getZoneIndex(zones)];
        value.textContent = `${zone.price} (${zone.name})`;
        if (total) total.textContent = WWShipping.formatMoney(subtotal + WWCartShipping.toCents(zone.price), this.dataset.moneyFormat);
      }
    }
  );
}

(() => {
  const drawer = document.querySelector('cart-drawer.ww-cart-drawer');
  if (!drawer || !window.WWMotion) return;
  const { EASE } = WWMotion;

  const snapshot = () => ({
    open: drawer.classList.contains('active'),
    fill: drawer.querySelector('[data-ww-free-fill]')?.style.width ?? null,
    totals: new Map(
      Array.from(drawer.querySelectorAll('.ww-cart-item')).map((item) => [
        item.querySelector('[data-quantity-line-key]')?.dataset.quantityLineKey,
        item.querySelector('.ww-cart-item__total')?.textContent.trim(),
      ])
    ),
    subtotal: drawer.querySelector('.ww-cart__subtotal-value')?.textContent.trim(),
  });
  let last = snapshot();

  const entrance = () => {
    WWMotion.swapIn(drawer.querySelectorAll('.ww-cart__strip, .ww-cart-item, .ww-cart__upsell'), {
      y: 14,
      duration: 480,
      stagger: 55,
    });
  };

  const afterRender = () => {
    const now = snapshot();
    const fill = drawer.querySelector('[data-ww-free-fill]');
    if (fill && last.fill && now.fill !== last.fill && !WWMotion.reduced()) {
      fill.animate([{ width: last.fill }, { width: now.fill }], { duration: 700, easing: EASE });
    }
    const changed = Array.from(drawer.querySelectorAll('.ww-cart-item'))
      .filter((item) => {
        const key = item.querySelector('[data-quantity-line-key]')?.dataset.quantityLineKey;
        return last.totals.has(key) && last.totals.get(key) !== item.querySelector('.ww-cart-item__total')?.textContent.trim();
      })
      .map((item) => item.querySelector('.ww-cart-item__total'));
    if (last.subtotal && now.subtotal !== last.subtotal) {
      changed.push(drawer.querySelector('.ww-cart__subtotal-value'), drawer.querySelector('[data-ww-checkout-total]'));
    }
    // Lines that weren't there before (e.g. the upsell) slide in.
    const added = Array.from(drawer.querySelectorAll('.ww-cart-item')).filter(
      (item) => !last.totals.has(item.querySelector('[data-quantity-line-key]')?.dataset.quantityLineKey)
    );
    if (last.open && now.open) {
      WWMotion.swapIn(changed, { y: 6, duration: 360 });
      WWMotion.swapIn(added, { y: 14, duration: 480 });
    }
    last = now;
  };

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(() => {
      queued = false;
      afterRender();
    });
  }).observe(drawer, { childList: true, subtree: true });

  new MutationObserver(() => {
    const open = drawer.classList.contains('active');
    if (open && !last.open) entrance();
    last.open = open;
  }).observe(drawer, { attributes: true, attributeFilter: ['class'] });

  // Remove: slide the line out right away; Dawn's re-render replaces it.
  drawer.addEventListener(
    'click',
    (event) => {
      const button = event.target.closest('.ww-cart-item__remove');
      const item = button?.closest('.ww-cart-item');
      if (!item || WWMotion.reduced()) return;
      const out = item.animate([{ opacity: 1, transform: 'none' }, { opacity: 0.15, transform: 'translateX(24px)' }], {
        duration: 260,
        easing: EASE,
        fill: 'forwards',
      });
      window.setTimeout(() => item.isConnected && out.cancel(), 4000); // request failed: show it again
    },
    true
  );
})();
