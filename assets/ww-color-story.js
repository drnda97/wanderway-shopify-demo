/**
 * Wander Way demo - <ww-color-story>
 * Shows the panel that matches the currently selected colour.
 * Hooks into Dawn's pub/sub (PUB_SUB_EVENTS.variantChange), so it works with
 * button, dropdown and swatch pickers without touching Dawn's own JS.
 */
if (!customElements.get('ww-color-story')) {
  customElements.define(
    'ww-color-story',
    class WWColorStory extends HTMLElement {
      connectedCallback() {
        this.optionIndex = parseInt(this.dataset.optionIndex, 10);
        this.productSection = this.dataset.productSection || null;
        this.panels = Array.from(this.querySelectorAll('[data-color]'));
        if (this.optionIndex < 0 || this.panels.length === 0) return;
        if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;

        this.unsubscribe = subscribe(PUB_SUB_EVENTS.variantChange, (event) => this.onVariantChange(event));
      }

      disconnectedCallback() {
        if (this.unsubscribe) this.unsubscribe();
      }

      onVariantChange(event) {
        const data = event && event.data;
        if (!data || !data.variant) return; // unavailable combination: keep current panel
        if (this.productSection && data.sectionId !== this.productSection) return;

        const value = (data.variant.options[this.optionIndex] || '').toString().trim().toLowerCase();
        this.show(value);
      }

      show(color) {
        const target = this.panels.find((panel) => panel.dataset.color === color);
        if (!target || !target.hidden) return;

        this.panels.forEach((panel) => {
          panel.hidden = panel !== target;
        });
        target.classList.remove('ww-color-story__panel--enter');
        // restart the fade-in animation
        void target.offsetWidth;
        target.classList.add('ww-color-story__panel--enter');
      }
    }
  );
}
