/**
 * Wander Way demo - <ww-delivery-estimate>
 * Business-day delivery window, cut-off countdown and free-shipping progress.
 */
if (!customElements.get('ww-delivery-estimate')) {
  customElements.define(
    'ww-delivery-estimate',
    class WWDeliveryEstimate extends HTMLElement {
      connectedCallback() {
        this.select = this.querySelector('select');
        this.threshold = parseInt(this.dataset.threshold, 10) || 0;
        this.price = parseInt(this.dataset.price, 10) || 0;
        this.cutoffHour = parseInt(this.dataset.cutoffHour, 10);
        this.processingDays = parseInt(this.dataset.processingDays, 10) || 0;
        this.locale = this.dataset.locale || undefined;
        this.moneyFormat = this.dataset.moneyFormat || '{{amount}}';
        this.dateFormat = new Intl.DateTimeFormat(this.locale, { weekday: 'short', day: 'numeric', month: 'short' });

        this.select.addEventListener('change', () => this.render());

        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            const variant = event && event.data && event.data.variant;
            if (!variant) return;
            this.price = variant.price;
            this.render();
          });
        }

        this.render();
        this.timer = setInterval(() => this.renderCutoff(), 60 * 1000);
      }

      disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
        clearInterval(this.timer);
      }

      get zone() {
        const option = this.select.options[this.select.selectedIndex];
        return {
          rate: parseInt(option.dataset.rate, 10) || 0,
          min: parseInt(option.dataset.min, 10) || 1,
          max: parseInt(option.dataset.max, 10) || 1,
        };
      }

      render() {
        const zone = this.zone;
        const freeShipping = this.threshold > 0 && this.price >= this.threshold;

        const dispatch = this.dispatchDate(new Date());
        const from = this.addBusinessDays(dispatch, zone.min);
        const to = this.addBusinessDays(dispatch, Math.max(zone.max, zone.min));
        this.querySelector('[data-ww-window]').textContent =
          zone.min === zone.max
            ? this.dateFormat.format(from)
            : `${this.dateFormat.format(from)} – ${this.dateFormat.format(to)}`;

        this.querySelector('[data-ww-rate]').textContent =
          freeShipping || zone.rate === 0 ? this.freeWord() : this.formatMoney(zone.rate);

        this.renderFreeShipping();
        this.renderCutoff();
      }

      renderFreeShipping() {
        const text = this.querySelector('[data-ww-free-text]');
        if (!text || this.threshold <= 0) return;
        const bar = this.querySelector('[data-ww-bar]');
        const fill = this.querySelector('[data-ww-bar-fill]');
        const pct = Math.min(100, Math.round((this.price / this.threshold) * 100));

        text.textContent =
          this.price >= this.threshold
            ? 'This item ships free.'
            : `Add ${this.formatMoney(this.threshold - this.price)} more for free shipping.`;
        fill.style.width = `${pct}%`;
        bar.setAttribute('aria-valuenow', pct);
        bar.classList.toggle('is-complete', pct >= 100);
      }

      renderCutoff() {
        const el = this.querySelector('[data-ww-cutoff]');
        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setHours(this.cutoffHour, 0, 0, 0);

        if (this.isBusinessDay(now) && now < cutoff && this.processingDays === 0) {
          const mins = Math.ceil((cutoff - now) / 60000);
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          el.textContent = `Order within ${h ? `${h}h ` : ''}${m}m to ship today.`;
          el.hidden = false;
        } else {
          el.hidden = true;
        }
      }

      dispatchDate(now) {
        let date = new Date(now);
        const afterCutoff = now.getHours() >= this.cutoffHour;
        if (!this.isBusinessDay(date) || afterCutoff) date = this.addBusinessDays(date, 1);
        return this.addBusinessDays(date, this.processingDays);
      }

      addBusinessDays(start, days) {
        const date = new Date(start);
        let added = 0;
        while (added < days) {
          date.setDate(date.getDate() + 1);
          if (this.isBusinessDay(date)) added += 1;
        }
        while (!this.isBusinessDay(date)) date.setDate(date.getDate() + 1);
        return date;
      }

      isBusinessDay(date) {
        const day = date.getDay();
        return day !== 0 && day !== 6;
      }

      freeWord() {
        return window.variantStrings && window.variantStrings.free ? window.variantStrings.free : 'Free';
      }

      formatMoney(cents) {
        const value = cents / 100;
        const fmt = (decimals, thousands, decimal) => {
          const parts = value.toFixed(decimals).split('.');
          parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
          return parts.join(decimal);
        };
        return this.moneyFormat.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
          switch (key) {
            case 'amount_no_decimals':
              return fmt(0, ',', '.');
            case 'amount_with_comma_separator':
              return fmt(2, '.', ',');
            case 'amount_no_decimals_with_comma_separator':
              return fmt(0, '.', ',');
            case 'amount_with_apostrophe_separator':
              return fmt(2, "'", '.');
            default:
              return fmt(2, ',', '.');
          }
        });
      }
    }
  );
}
