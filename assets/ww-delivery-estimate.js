/**
 * Wander Way demo – <ww-delivery-estimate>
 * Zone picker (remembered in localStorage), arrival window in business days
 * from today's dispatch (or the next business day after the cut-off), and the
 * free-shipping bar fed by /cart.js, refreshed on PUB_SUB_EVENTS.cartUpdate.
 * Needs ww-shipping.js.
 */
if (!customElements.get('ww-delivery-estimate')) {
  customElements.define(
    'ww-delivery-estimate',
    class WWDeliveryEstimate extends HTMLElement {
      connectedCallback() {
        this.zones = WWShipping.parseZones(this.dataset.zones);
        this.select = this.querySelector('[data-ww-zone]');
        if (!this.zones.length || !this.select) return;

        this.select.selectedIndex = WWShipping.getZoneIndex(this.zones);
        this.select.addEventListener('change', () => {
          WWShipping.saveZone(this.zone);
          this.renderZone();
        });
        this.renderZone();
        this.timer = window.setInterval(() => this.renderZone(), 60 * 1000);

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.cartUpdate, () => this.refreshCart());
        }
      }

      disconnectedCallback() {
        window.clearInterval(this.timer);
        this.unsubscribe?.();
      }

      get zone() {
        return this.zones[this.select.selectedIndex] || this.zones[0];
      }

      renderZone() {
        const zone = this.zone;
        const { dispatch } = WWShipping.dispatch(this.dataset.timezone, Number(this.dataset.cutoffHour));
        const from = WWShipping.addBusinessDays(dispatch, zone.min);
        const to = WWShipping.addBusinessDays(dispatch, zone.max);
        const locale = this.dataset.locale;
        const arrival =
          zone.min === zone.max
            ? WWShipping.formatDate(from, locale)
            : `${WWShipping.formatDate(from, locale)} – ${WWShipping.formatDate(to, locale)}`;

        const values = {
          '[data-ww-arrival]': arrival,
          '[data-ww-days]': (this.dataset.days || '').replace('[min]', zone.min).replace('[max]', zone.max),
          '[data-ww-price]': zone.price,
          '[data-ww-carrier]': zone.carrier,
        };
        const changed = [];
        Object.entries(values).forEach(([selector, text]) => {
          const el = this.querySelector(selector);
          if (el.textContent === text) return;
          el.textContent = text;
          changed.push(el);
        });
        // Animate zone changes, not the first paint or the per-minute refresh.
        if (this.rendered && changed.length) window.WWMotion?.swapIn(changed, { y: 8, duration: 420, stagger: 60 });
        this.rendered = true;
      }

      /** Re-read the cart total; the progress markup is rendered by Liquid on load. */
      async refreshCart() {
        const free = this.querySelector('[data-ww-free-shipping]');
        if (!free) return;
        try {
          const response = await fetch(`${window.routes?.cart_url || '/cart'}.js`, { headers: { Accept: 'application/json' } });
          const cart = await response.json();
          this.renderFreeShipping(free, cart.total_price);
        } catch (error) {
          /* keep the last rendered state */
        }
      }

      renderFreeShipping(free, total) {
        const rate = Number(window.Shopify?.currency?.rate) || 1;
        const threshold = Math.round(Number(free.dataset.threshold) * rate);
        const format = this.dataset.moneyFormat;
        const unlocked = total >= threshold;
        const percent = Math.min(100, Math.round((total / threshold) * 100));

        free.classList.toggle('is-unlocked', unlocked);
        const text = free.querySelector('[data-ww-free-text]');
        if (unlocked) {
          text.textContent = free.dataset.unlockedText;
        } else {
          const [before, after = ''] = free.dataset.remainingText.split('[amount]');
          const strong = document.createElement('strong');
          strong.textContent = WWShipping.formatMoney(threshold - total, format);
          text.replaceChildren(before, strong, after);
        }
        free.querySelector('[data-ww-free-amount]').textContent = `${WWShipping.formatMoney(total, format)} / ${WWShipping.formatMoney(threshold, format)}`;
        const bar = free.querySelector('[data-ww-free-bar]');
        bar.setAttribute('aria-valuenow', String(Math.min(total, threshold) / 100));
        bar.setAttribute('aria-valuemax', String(threshold / 100));
        free.querySelector('[data-ww-free-fill]').style.width = `${percent}%`;
      }
    }
  );
}
