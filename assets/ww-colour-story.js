/**
 * Wander Way demo – <ww-colour-story data-colour-index>
 * Shows the panel for the selected colour and keeps it in sync with Dawn's
 * variant picker in both directions:
 *  - PUB_SUB_EVENTS.variantChange -> switch panel (cross-fade in CSS)
 *  - swatch click -> click the matching input in <variant-selects>, so Dawn
 *    updates price, media, URL and the form; the event above then confirms.
 */
if (!customElements.get('ww-colour-story')) {
  customElements.define(
    'ww-colour-story',
    class WWColourStory extends HTMLElement {
      connectedCallback() {
        this.colourIndex = Number(this.dataset.colourIndex);
        this.panels = Array.from(this.querySelectorAll('.ww-colour-story__panel'));
        if (this.colourIndex < 0 || !this.panels.length) return;

        this.addEventListener('click', this.onClick);
        if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
          this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => {
            const variant = event?.data?.variant;
            if (variant) this.show(variant.options[this.colourIndex]);
          });
        }
      }

      disconnectedCallback() {
        this.removeEventListener('click', this.onClick);
        this.unsubscribe?.();
      }

      onClick = (event) => {
        const swatch = event.target.closest('.ww-colour-story__swatch');
        if (!swatch) return;
        const value = swatch.dataset.value;
        this.show(value);
        this.selectInMainPicker(value);
      };

      selectInMainPicker(value) {
        const picker = document.querySelector('variant-selects');
        if (!picker) return;
        const radio = Array.from(picker.querySelectorAll('input[type="radio"]')).find((input) => input.value === value);
        if (radio) {
          if (!radio.checked) radio.click();
          return;
        }
        const select = Array.from(picker.querySelectorAll('select')).find((el) =>
          Array.from(el.options).some((option) => option.value === value)
        );
        if (select && select.value !== value) {
          select.value = value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }

      show(value) {
        const wanted = String(value || '').trim().toLowerCase();
        const target = this.panels.find((panel) => panel.dataset.colour === wanted);
        if (!target) return;

        this.panels.forEach((panel) => {
          const active = panel === target;
          panel.classList.toggle('is-active', active);
          panel.inert = !active;
          if (active) panel.removeAttribute('aria-hidden');
          else panel.setAttribute('aria-hidden', 'true');
        });
        this.querySelectorAll('.ww-colour-story__swatch').forEach((swatch) => {
          swatch.setAttribute('aria-pressed', String(swatch.dataset.value.toLowerCase() === wanted));
        });
      }
    }
  );
}
