/**
 * Wander Way demo – shared shipping helpers + <ww-cutoff>.
 * Used by the delivery-estimate block and the cart drawer.
 *
 * All dates are calendar days in the store timezone (theme setting), kept as
 * UTC-midnight Date objects so day arithmetic is DST-proof.
 */
window.WWShipping = window.WWShipping || {
  /** "Name|min|max|price|carrier" lines -> [{ name, min, max, price, carrier }] */
  parseZones(text) {
    return (text || '')
      .split('\n')
      .map((line) => line.split('|').map((part) => part.trim()))
      .filter((parts) => parts[0])
      .map(([name, min, max, price = '', carrier = '']) => ({
        name,
        min: parseInt(min, 10) || 0,
        max: parseInt(max, 10) || parseInt(min, 10) || 0,
        price,
        carrier,
      }));
  },

  storageKey: 'ww:shipping-zone',

  getZoneIndex(zones) {
    try {
      const saved = window.localStorage.getItem(this.storageKey);
      const index = zones.findIndex((zone) => zone.name === saved);
      return index >= 0 ? index : 0;
    } catch (error) {
      return 0;
    }
  },

  saveZone(zone) {
    try {
      window.localStorage.setItem(this.storageKey, zone.name);
    } catch (error) {
      /* storage blocked: the choice just isn't remembered */
    }
  },

  /** Current wall-clock time in the store timezone. */
  now(timeZone) {
    let parts;
    try {
      parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(new Date());
    } catch (error) {
      parts = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23',
      }).formatToParts(new Date());
    }
    const get = (type) => parseInt(parts.find((part) => part.type === type).value, 10);
    return {
      date: new Date(Date.UTC(get('year'), get('month') - 1, get('day'))),
      minutes: get('hour') * 60 + get('minute'),
    };
  },

  isBusinessDay(date) {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6;
  },

  addBusinessDays(date, days) {
    const result = new Date(date.getTime());
    let left = days;
    while (left > 0) {
      result.setUTCDate(result.getUTCDate() + 1);
      if (this.isBusinessDay(result)) left -= 1;
    }
    return result;
  },

  /** { shipsToday, minutesLeft, dispatch } for the given cut-off hour. */
  dispatch(timeZone, cutoffHour) {
    const { date, minutes } = this.now(timeZone);
    const minutesLeft = cutoffHour * 60 - minutes;
    const shipsToday = this.isBusinessDay(date) && minutesLeft > 0;
    return { shipsToday, minutesLeft, dispatch: shipsToday ? date : this.addBusinessDays(date, 1) };
  },

  /** "Tue 20 Oct" with localised day/month names. */
  formatDate(date, locale) {
    let parts;
    try {
      parts = new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).formatToParts(date);
    } catch (error) {
      parts = new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).formatToParts(date);
    }
    const get = (type) => (parts.find((part) => part.type === type) || {}).value || '';
    return `${get('weekday').replace(/\.$/, '')} ${get('day')} ${get('month').replace(/\.$/, '')}`;
  },

  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`;
  },

  /** Shopify money format ("€{{amount}}") without trailing zeros, like money_without_trailing_zeros. */
  formatMoney(cents, format = '{{amount}}') {
    const value = (Number(cents) || 0) / 100;
    const render = (decimals, thousands, decimal) => {
      const [whole, fraction] = value.toFixed(decimals).split('.');
      const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
      return fraction && !/^0+$/.test(fraction) ? `${grouped}${decimal}${fraction}` : grouped;
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (match, key) => {
      switch (key) {
        case 'amount_no_decimals':
          return render(0, ',', '.');
        case 'amount_with_comma_separator':
          return render(2, '.', ',');
        case 'amount_no_decimals_with_comma_separator':
          return render(0, '.', ',');
        case 'amount_with_apostrophe_separator':
          return render(2, "'", '.');
        case 'amount_with_space_separator':
          return render(2, ' ', ',');
        default:
          return render(2, ',', '.');
      }
    });
  },
};

/**
 * <ww-cutoff data-timezone data-cutoff-hour data-today="Order within [time] to ship today" data-later="Ships next business day">
 * Renders the dispatch countdown and refreshes it every minute.
 */
if (!customElements.get('ww-cutoff')) {
  customElements.define(
    'ww-cutoff',
    class WWCutoff extends HTMLElement {
      connectedCallback() {
        this.render();
        this.timer = window.setInterval(() => this.render(), 60 * 1000);
      }

      disconnectedCallback() {
        window.clearInterval(this.timer);
      }

      render() {
        const text = this.querySelector('[data-ww-cutoff-text]');
        if (!text) return;
        const { shipsToday, minutesLeft } = WWShipping.dispatch(this.dataset.timezone, Number(this.dataset.cutoffHour));
        if (shipsToday) {
          const [before, after = ''] = this.dataset.today.split('[time]');
          const strong = document.createElement('strong');
          strong.textContent = WWShipping.formatDuration(minutesLeft);
          text.replaceChildren(before, strong, after);
        } else {
          text.textContent = this.dataset.later;
        }
        this.hidden = false;
      }
    }
  );
}
