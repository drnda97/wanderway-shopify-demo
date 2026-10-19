/**
 * Wander Way demo – <ww-collection>
 * Dawn's facets.js re-renders #ProductGridContainer after every filter
 * change. This element watches that container and mirrors the number of
 * active filters onto the drawer trigger ("Filter (2)").
 */
if (!customElements.get('ww-collection')) {
  customElements.define(
    'ww-collection',
    class WWCollection extends HTMLElement {
      connectedCallback() {
        this.results = this.querySelector('#ProductGridContainer');
        if (!this.results) return;
        this.observer = new MutationObserver(() => this.updateFilterCount());
        this.observer.observe(this.results, { childList: true });
        this.updateFilterCount();
      }

      disconnectedCallback() {
        this.observer?.disconnect();
      }

      updateFilterCount() {
        const count = Number(this.querySelector('.ww-collection__count')?.dataset.activeFilters || 0);
        this.querySelectorAll('.mobile-facets__open-label').forEach((label) => {
          if (count > 0) label.dataset.wwCount = count;
          else delete label.dataset.wwCount;
        });
      }
    }
  );
}
