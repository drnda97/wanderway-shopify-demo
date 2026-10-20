You're working in my Shopify theme repo (Dawn, connected to GitHub). Rebuild an approved design 1:1 as a demo storefront for my studio, Wander Way (wanderway.rs). I'll send this store to agencies as a portfolio piece, so the visual match and code quality both matter.

The full handoff package is in `./wanderway-demo-handoff/` (move it there if it isn't). Before you write any code:

1. Read `wanderway-demo-handoff/HANDOFF.md` from start to finish. It's the build spec.
2. Look at every screenshot in `wanderway-demo-handoff/reference/screens/`. They are the visual target: desktop at 1440px, mobile at 390px.
3. For exact values (px sizes, colours, gaps, radii, copy text), read the matching file in `wanderway-demo-handoff/reference/source/*.dc.html`. The inline styles are the spec, and the `<script>` at the bottom of each file holds the data (products, reviews, colour-story copy, shipping zones). Copy all text verbatim.
4. To see the intended interactions, open the files in `wanderway-demo-handoff/reference/html/*.html` in a browser. They work offline.

Then:

- Create the branch `feature/wanderway-demo`.
- Install the foundation first:
  - Copy `theme-starter/assets/*` to `assets/` (tokens CSS + woff2 fonts).
  - Copy `theme-starter/snippets/ww-fonts.liquid` to `snippets/`.
  - Copy `images/*.jpg` to `assets/`.
  - Wire the fonts and tokens into `layout/theme.liquid` (tokens load after `base.css`).
  - Set the colour schemes in `config/settings_data.json` as described in HANDOFF §2.
- Build in this order, committing after each step with a clear message:
  1. Global, header and footer (§2–3)
  2. Product card with swatches (§5 card)
  3. Home sections (§4)
  4. Collection page and facets (§5)
  5. Product page: main-product restyle, `ww-delivery-estimate`, `ww-colour-story`, `ww-stats`, `ww-testimonials`, related (§6)
  6. Cart drawer (§7)
- Rules:
  - Prefix new files with `ww-` and keep Dawn core edits minimal.
  - Use vanilla JS custom elements and Dawn's `pubsub`/`PUB_SUB_EVENTS` (check the event names and payloads in this repo's Dawn version before relying on them). No JS libraries.
  - Make every text, image, product and threshold a section or block setting with the design's values as defaults.
  - Image settings fall back to the bundled assets, so the store looks right with zero configuration.
  - Use CSS variables from `ww-tokens.css`, never raw hex values.
  - Accessibility as specified in HANDOFF §1.
- Templates: update `templates/index.json`, `collection.json`, `product.json` and the header/footer group JSON, so the sections appear in the right order with the defaults from the design.
- Run `shopify theme dev` and verify visually:
  - Screenshot each page at exactly 1440×900 and 390×844 (full page). Use Playwright via `npx playwright`, or ask me to check.
  - Compare against `reference/screens/` and fix any difference in layout, spacing, type, colour or copy.
  - Repeat until it's a 1:1 match.
- Run `shopify theme check` and fix everything until it reports 0 offences.
- Product data:
  - Prepare `wanderway-demo-handoff/data/products.csv` for import by replacing the `{{ASSET:file.jpg}}` placeholders with the public asset URLs of the pushed theme (HANDOFF §8).
  - Write me a short checklist of the Admin steps I have to do by hand: product import, automated collections, menu, Search & Discovery filters, shipping rates, EUR currency.
- Finish:
  - Open a PR (or give me the summary) listing every new file and every Dawn core file you edited.
  - Include anything you couldn't match 1:1 and why.

If something in the spec conflicts with how this Dawn version works, pick the solution closest to the screenshots and note it. Don't ask me about details the reference files already answer.
