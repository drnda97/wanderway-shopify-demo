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
