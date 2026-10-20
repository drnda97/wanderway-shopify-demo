/**
 * Wander Way demo – shared motion helpers (loaded on every page).
 *
 * WWMotion.swapIn(elements)  – fade/slide in content that just changed
 * WWMotion.reduced()         – prefers-reduced-motion
 *
 * Scroll reveal: elements with [data-ww-reveal] fade up the first time they
 * enter the viewport; elements revealed together are staggered in reading
 * order. Anything already on screen at load is left alone (no flash, no LCP
 * delay), and nothing is hidden without JavaScript or with reduced motion.
 * Elements added later (e.g. re-rendered grids) are picked up automatically.
 */
window.WWMotion =
  window.WWMotion ||
  (() => {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const EASE = 'cubic-bezier(.2, .7, .2, 1)';
    const reduced = () => reducedQuery.matches;

    const swapIn = (elements, { y = 6, duration = 380, stagger = 45 } = {}) => {
      if (reduced() || !elements) return;
      const list = elements instanceof Element ? [elements] : Array.from(elements);
      list.filter(Boolean).forEach((el, i) => {
        if (getComputedStyle(el).display === 'inline') el.style.display = 'inline-block';
        el.animate([{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: 'none' }], {
          duration,
          delay: i * stagger,
          easing: EASE,
          fill: 'backwards',
        });
      });
    };

    /* ---- Scroll reveal ---- */
    const observer =
      'IntersectionObserver' in window
        ? new IntersectionObserver(
            (entries) => {
              entries
                .filter((entry) => entry.isIntersecting)
                .map((entry) => entry.target)
                .sort((a, b) => {
                  const ra = a.getBoundingClientRect();
                  const rb = b.getBoundingClientRect();
                  return ra.top - rb.top || ra.left - rb.left;
                })
                .forEach((el, i) => {
                  observer.unobserve(el);
                  el.style.setProperty('--ww-reveal-delay', `${Math.min(i, 6) * 70}ms`);
                  el.classList.remove('is-pending');
                  el.classList.add('is-revealed');
                });
            },
            { rootMargin: '0px 0px -8% 0px' }
          )
        : null;

    const prepare = (root = document) => {
      if (!observer || reduced()) return;
      root.querySelectorAll('[data-ww-reveal]:not(.is-pending):not(.is-revealed)').forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.92) {
          el.classList.add('is-revealed'); // already in view: never hide it
          return;
        }
        el.classList.add('is-pending');
        observer.observe(el);
      });
    };

    const start = () => {
      prepare();
      let queued = false;
      new MutationObserver((mutations) => {
        if (queued || !mutations.some((m) => m.addedNodes.length)) return;
        queued = true;
        window.requestAnimationFrame(() => {
          queued = false;
          prepare();
        });
      }).observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();

    return { swapIn, reduced, EASE, prepare };
  })();
