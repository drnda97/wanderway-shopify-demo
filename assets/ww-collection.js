/**
 * Wander Way demo – <ww-collection>
 * Dawn's facets.js re-renders #ProductGridContainer after every filter
 * change. This element watches that container and mirrors the number of
 * active filters onto the drawer trigger ("Filter (2)"), and fades the
 * freshly rendered cards in.
 *
 * Mobile filter drawer: Dawn submits on every change; here changes inside
 * the drawer wait for its Apply button (one AJAX render via Dawn's
 * FacetFiltersForm.renderPage). Closing without Apply resets the form to
 * the filters that are actually applied.
 */
if (!customElements.get('ww-collection')) {
  customElements.define(
    'ww-collection',
    class WWCollection extends HTMLElement {
      connectedCallback() {
        this.results = this.querySelector('#ProductGridContainer');
        if (!this.results) return;
        this.observer = new MutationObserver(() => {
          this.updateFilterCount();
          this.animateResults();
        });
        this.observer.observe(this.results, { childList: true });
        this.updateFilterCount();
        this.deferMobileFilters();
      }

      deferMobileFilters() {
        this.mobileForm = this.querySelector('#FacetFiltersFormMobile');
        this.disclosure = this.querySelector('.mobile-facets__disclosure');
        if (!this.mobileForm || !this.disclosure) return;
        this.pending = false;

        // Capture on the form runs before Dawn's bubbling 'input' listener there.
        this.mobileForm.addEventListener(
          'input',
          (event) => {
            event.stopPropagation();
            this.pending = true;
          },
          true
        );

        this.disclosure.addEventListener('click', (event) => {
          if (event.target.closest('.mobile-facets__footer .button--primary')) this.applyMobileFilters();
        });

        this.disclosure.addEventListener('toggle', () => {
          if (this.disclosure.open || !this.pending) return;
          this.mobileForm.reset(); // closed without Apply: back to the applied filters
          this.pending = false;
        });
      }

      applyMobileFilters() {
        if (!this.pending || typeof FacetFiltersForm === 'undefined') return;
        this.pending = false;
        FacetFiltersForm.renderPage(new URLSearchParams(new FormData(this.mobileForm)).toString());
      }

      disconnectedCallback() {
        this.observer?.disconnect();
      }

      animateResults() {
        const cards = Array.from(this.querySelectorAll('#product-grid > li')).filter(
          (card) => card.getBoundingClientRect().top < window.innerHeight
        );
        window.WWMotion?.swapIn(cards.slice(0, 9), { y: 16, duration: 520, stagger: 55 });
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
