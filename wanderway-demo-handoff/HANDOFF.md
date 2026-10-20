# Wander Way demo store — build spec for Shopify Dawn

Goal: rebuild the approved design **1:1** on top of Dawn (Online Store 2.0) as a portfolio demo
store by Wander Way (wanderway.rs). Everything visual is already decided — this document says
*where it goes in Dawn* and *how the custom pieces behave*.

---

## 0. Sources of truth (in priority order)

| What | Where | Use it for |
|---|---|---|
| Screenshots | `reference/screens/*.png` (desktop 1440 @1x, mobile 390 @2x) | The visual target. Compare against these. |
| Interactive previews | `reference/html/*.html` (open in a browser, works offline) | Hover, swatches, carousels, zone dropdown, cart qty — see the intended behaviour. |
| Design source | `reference/source/*.dc.html` | **Exact values**: every px size, colour, radius, gap, copy text is in the inline `style=""` attributes. When a screenshot is ambiguous, read the source. Copy text verbatim from here. |
| Tokens | `theme-starter/assets/ww-tokens.css` | All colours, type scale, radii, spacing, button styles as CSS variables + helper classes. Use variables, never hard-code hexes in sections. |
| Fonts | `theme-starter/assets/*.woff2` + `theme-starter/snippets/ww-fonts.liquid` | Self-hosted Hanken Grotesk + JetBrains Mono (OFL, latin + latin-ext). |
| Photos | `images/*.jpg` (1400px, already optimised) | Product + section imagery. Credits in `images/CREDITS.md`. |
| Products | `data/products.csv` | Shopify product import (8 products × 3 colours). |

`reference/source/*.dc.html` use a tiny template syntax: `{{ x }}` = data from the `<script>` at
the bottom of each file, `<sc-for>` = loop, `<sc-if>` = conditional. Data (product names,
prices, review copy, colour-story copy, shipping zones) lives in that script block.

Screen ↔ file map:

| Screen | Screenshot | Source |
|---|---|---|
| Home desktop / mobile | `01-home-desktop.png`, `01-home-mobile.png` | `Home.dc.html`, `Home-Mobile.dc.html` |
| Collection | `02-collection-*.png` | `Collection.dc.html`, `Collection-Mobile.dc.html` |
| Product (Black state desktop, Olive state mobile) | `03-product-*.png` | `Product.dc.html`, `Product-Mobile.dc.html` |
| Colour story — Olive state | `03-colour-story-olive.png` | `ColourStory-Olive.dc.html` |
| Cart drawer | `04-cart-drawer-*.png` | `Cart.dc.html`, `Cart-Mobile.dc.html` |
| Tokens | `05-design-tokens.png` | `Tokens.dc.html` |

---

## 1. Ground rules

- Build on the existing Dawn in the repo. **Prefix every new file `ww-`** (sections, snippets,
  assets). Keep edits to Dawn core files minimal and list each one in the PR description, so the
  theme stays upgradable.
- No JS libraries (no Swiper, Slick, jQuery, GSAP). Vanilla JS as custom elements, the way Dawn
  does it. Use Dawn's `pubsub.js` / `PUB_SUB_EVENTS` (`variantChange`, `cartUpdate`).
- Everything a merchant would want to change is a section/block setting (text, images, products,
  thresholds). Images: `image_picker` settings that **fall back to the bundled asset** when empty
  (`{{ 'lifestyle-platform.jpg' | asset_url }}`), so the store looks right out of the box.
- Images through `image_url` + `image_tag` with `widths`/`sizes` (responsive, lazy below the
  fold). Bundled fallbacks: plain `<img loading="lazy" width height>`.
- Accessibility as drawn: real `<button>`/`<a>`, `aria-pressed` on swatches, `aria-label` on icon
  buttons, `role="progressbar"` + `aria-valuenow` on progress bars, focus ring
  `2px var(--ww-accent)` offset 2px, touch targets ≥ 44px, `prefers-reduced-motion` respected.
- `shopify theme check` must report **0 offences** before you finish.
- Breakpoints: Dawn's 750px / 990px. Design frames are 1440 (desktop) and 390 (mobile); tablet
  follows the mobile layout up to 749px and the desktop layout from 990px (750–989 = sensible
  in-between, e.g. 2-col grids).

---

## 2. Global setup

1. Copy `theme-starter/assets/*` → `assets/`, `theme-starter/snippets/ww-fonts.liquid` → `snippets/`.
2. `layout/theme.liquid`: `{% render 'ww-fonts' %}` in `<head>`, and
   `{{ 'ww-tokens.css' | asset_url | stylesheet_tag }}` **after** `base.css`.
   The token file ends with a "Dawn bridge" that maps Dawn's `--font-*`, `--buttons-radius`,
   `--page-width` etc. to the tokens.
3. Copy `images/*.jpg` → `assets/` (used as section fallbacks and as the product-import image
   source, see §8).
4. `config/settings_data.json` colour scheme 1 (default): background `#FAFAFC`, text `#111114`,
   solid button `#111114`, button label `#FAFAFC`, secondary button / outline `#111114`,
   shadow `#111114`. Scheme 2 ("inverse", for the editorial banner/announcement): background
   `#111114`, text `#FAFAFC`, button `#FAFAFC`, label `#111114`. Turn off Dawn card/button
   shadows; card style "standard", no card border (cards are image + text, not boxed).
5. Page width: content 1280 + 80px gutters at 1440 (`--ww-gutter`), 20px gutters on mobile.
   Vertical rhythm between sections: 120px desktop / 64px mobile.
6. Typography rules (tokens): headings 500 weight, tight negative tracking; **exactly one word
   per headline in `<em>` (italic 400)** — e.g. `Bags that make every trip feel <em>lighter.</em>`.
   Allow `<em>` in heading settings (use `richtext`/`inline_richtext`, or a separate
   "italic word" text setting). Eyebrows/tags/counters = JetBrains Mono, 12px, uppercase, +0.08em.

---

## 3. Header group

**Announcement bar** (Dawn `announcement-bar`, scheme inverse): `#111114` bar, 13.5px text
"Demo store by Wander Way – no real orders", preceded by a mono "DEMO" label in `#B9B9C6`
(desktop only). Padding 10px. Not dismissible.

**Header** (Dawn `header`, edit via CSS + 1 setting):
- Height 76px desktop / 64px mobile, `border-bottom: 1px solid var(--ww-border)`, background
  `--ww-bg`, sticky ok.
- Layout `grid-template-columns: 1fr auto 1fr`: wordmark left, menu centred, icons right.
- Wordmark: shop name as text "Wander Way" 21px/600/-0.025em (no logo image) + a **"DEMO" pill**
  (`.ww-badge-demo`). Add a header setting `ww_badge_text` (default "Demo") and render the pill
  next to the shop name. It must always be visible — the store has to read as a demo.
- Menu: Shop all · Backpacks · Travel · Accessories, 15px, colour `--ww-ink-2`, active/hover ink,
  36px gap, no underlines. Mobile: hamburger left of wordmark (Dawn drawer menu).
- Icons: search, account, cart — 20px, 1.6px stroke, 44px circular hit area, hover bg
  `--ww-surface-2`. Cart count bubble: 18px black circle, white 11px/600 number.

**Footer** (Dawn `footer`, restyle): see bottom of `01-home-desktop.png`. Brand column (wordmark +
DEMO pill + "A fictional store for showing Shopify theme work. Products, prices and reviews are
samples. Photos via Unsplash.") + 3 link columns (Shop / Help / Studio) with mono eyebrows.
Bottom row: "© 2026 Wander Way · Demo store, no real orders" left, **"Built by Wander Way –
wanderway.rs ↗"** right, linking to https://wanderway.rs (target _blank, rel noopener). Collection
and product pages use only the bottom row in the mockups — fine to keep the full footer
everywhere, but the bottom row must match.

---

## 4. Home (`templates/index.json`)

Order of sections (desktop values; mobile in `Home-Mobile.dc.html`):

1. **`ww-hero`** — 2 columns (1fr / 1.05fr, gap 72px), padding 80px top / 112px bottom.
   Left: eyebrow "Travel bags & accessories · Demo collection", H1 76px (italic last word),
   paragraph 19px `--ww-ink-2` max-width 480, buttons **primary "Shop the collection →"**
   (link to /collections/all) + **secondary "See the product page"** (link to the daypack),
   then a 1px divider + 3 trust items 14px ("Free shipping over €150", "30-day returns",
   "Demo checkout only"). Right: image (default `weekender-sand.jpg`), radius 28px, aspect
   5/5.4, cover. Overlays: top-right mono pill "AW26 · Demo"; bottom-left floating product card
   (white 94%, radius 16px, `--ww-shadow-float`) with 52px thumb, product title 15/600, "€196 ·
   Sand", and a 40px black circular arrow link → product. Settings: heading, italic word,
   text, 2 buttons, image, featured product (for the floating card), 3 trust lines, pill text.
   Mobile: stacked, buttons full width, image aspect 4/4.6, floating card spans width.
2. **Featured products** — Dawn `featured-collection` restyled, *or* `ww-featured-products`.
   Eyebrow "Featured", H2 "The core *four.*", link "View all products →". 4-col grid, gap 24
   (mobile 2-col, gap 24/12). Card = `snippets/card-product.liquid` restyled (see §5 card spec).
   Products: Transit Daypack (show Olive), Overnight Weekender, Everyday Tote (Sand),
   Essentials Pouch. Badges from product tags: `bestseller` → "Bestseller", `new` → "New".
3. **`ww-editorial-banner`** — full-bleed card inside the page width, height 560px (mobile 460),
   radius 28, image `lifestyle-platform.jpg` cover, gradient overlay
   `linear-gradient(90deg, rgba(14,14,18,.78) 0%, rgba(14,14,18,.45) 45%, rgba(14,14,18,0) 75%)`
   (mobile: bottom-up 0deg). Content bottom-left, padding 64, max-width 620: mono eyebrow
   "Journal · The in-between" (`#D6D6DE`), H2 52px white "Made for platforms, layovers and the
   long way *home.*", 17px text `#E4E4EA`, inverse button "Shop travel bags" + ghost button
   "Read the journal".
4. **`ww-built-with`** — one white card, radius 20, 1px border, 5 cells
   (`grid-template-columns: 1.3fr repeat(4,1fr)`, cells divided by 1px borders, padding 32):
   cell 1 eyebrow "Built with" + 20px line "A custom Dawn theme, *no page builders.*"; then
   Liquid / JavaScript / Shopify CLI / Theme Check — each: 28px line icon (inline SVG, 1.5
   stroke), mono 15/500 name, 14px `--ww-ink-3` caption ("Sections & blocks", "Vanilla web
   components", "Local dev & deploys", "Linted, zero offences"). Blocks = items. Mobile: header
   row + 2×2 grid.
5. **`ww-testimonials`** (layout "grid") — left column 360px: eyebrow "Reviews", H2 "Packed,
   carried, *approved.*", big "4.8" (56px) + 5 stars + "Average from 126 sample reviews",
   prev (outline) / next (black) 48px circular buttons + mono pager "01 / 06".
   Right: 3 visible cards (gap 20) that advance by one on prev/next (wraps). Card: white,
   radius 20, padding 28, min-height 340: stars (15px; empty star `#D6D6DE`) + mono tag
   **"SAMPLE REVIEW"** (required on every review), quote 17px, divider, 48px product thumbnail
   (links to the product), reviewer "Sample reviewer · City" 14/500 + product link 13.5px
   underlined. Mobile: one card at a time, pager left, buttons right. Content = blocks
   (rating 1–5, quote, reviewer label, product, colour label). Copy in `Home.dc.html` script.
6. **`ww-newsletter`** — card `--ww-surface-2`, radius 28, 1px border, grid 0.9fr / 1fr,
   min-height 440. Left image `lifestyle-station.jpg` cover. Right padding 64/72: eyebrow
   "Newsletter", H2 "Notes from the *road.*", text, label "Email address", pill input (52px,
   white, border `--ww-border-strong`) + black "Subscribe" button, note "Demo form – nothing is
   sent or stored." Use Dawn's `{% form 'customer' %}` so it actually works, keep the note.

---

## 5. Collection (`templates/collection.json`, `main-collection-product-grid`)

- Banner: breadcrumb (14px `--ww-ink-3`: Home / Shop all), H1 64px "Everything you need to
  *go.*" left, intro 16px max-width 380 right-aligned to the bottom. Padding 48/80/40.
- Layout `grid-template-columns: 248px 1fr; gap 48px`. Dawn facets in **vertical** mode,
  restyled:
  - Groups separated by 1px borders, padding 24px 0, legend 15/600.
  - Category = product type (or tag) checkboxes, 18px, `accent-color: #111114`, count right
    in 13px `--ww-ink-3`.
  - **Colour** = Search & Discovery "Color" filter rendered as full-width rows: 44px tall,
    radius 12, 18px colour dot (map value → `--ww-swatch-*`), name, count; active row = white bg
    + 1px ink border.
  - Price = two pill inputs "From / To". Availability = "In stock only" checkbox.
- Toolbar: product count left (+ active filter chips "Colour: Olive ×" as outline pills),
  "Sort by" + select (radius 12, 44px) right; 1px border below.
- Grid: 3 columns desktop (gap 40/24), 2 columns mobile (gap 28/12).
- Mobile: no sidebar; under the title a row with two pill buttons "Filter (n)" (opens Dawn's
  mobile facets drawer) and "Sort: Featured", then a row of 3 colour chips (Black / Sand / Olive)
  that toggle the colour filter, item count right.

**Product card (`card-product.liquid`, used everywhere):**
- Image: aspect 4/5, radius 20 (16 mobile), `object-fit: cover`, bg = colour tint, hover
  `scale(1.03)` 500ms. Badge top-left: white pill 12.5px/500 ("Bestseller", "New").
  Colour label bottom-right on collection grid: white 92% pill with 12px dot + colour name.
- Below: title 16/500 + price 16/500 on one row; colour name (+ " · Category" on collection)
  14px `--ww-ink-3`.
- **Swatches**: one button per `Color` value — 40px hit area (44 mobile), 20px dot (18 mobile)
  with `box-shadow: 0 0 0 2px var(--ww-bg), 0 0 0 3px <ring>` where ring = ink when selected,
  transparent otherwise; inset 1px rgba(17,17,20,.12). Clicking a swatch swaps the card image
  to that variant's `featured_image` (srcset too), updates the colour label and the card link
  (`?variant=`). Render the variant image URLs as `data-` attributes in Liquid; tiny
  `ww-card-swatches.js` custom element handles the click. Variants without their own image keep
  the product image (some demo products only have one photo).

---

## 6. Product (`templates/product.json`)

Section order: `main-product` → `ww-colour-story` → `ww-stats` → `ww-testimonials` (layout
"single") → related products ("Pairs well *with.*").

**main-product** (restyle Dawn, grid 1.22fr / 1fr, gap 72):
- Breadcrumb Home / Backpacks / Transit Daypack 22L.
- Gallery: main image aspect 1/1.05, radius 28, mono pills bottom-left ("BLACK · FRONT") and
  bottom-right ("1 / 4"). 4 thumbnails below (gap 12, radius 16, selected = 1.5px ink ring,
  others opacity .72). Changing colour shows that variant's image first. Mobile: full-bleed
  swipeable gallery (CSS scroll-snap) with dots + "1 / 4" counter.
- Buy box (gap 28): "Bestseller" pill + "★ 4.8 · 126 sample reviews" (anchor to reviews);
  title 52px with italic "*22L*"; price 26px + "Tax included. Demo store – checkout is
  disabled." 14px; description 16.5px `--ww-ink-2`.
- Colour picker (Dawn variant picker, "pills" style restyled): legend "**Colour:** Black",
  pills 48px tall, radius 999, 1.5px border (ink when selected, `--ww-border` otherwise), 22px
  dot + name 15/500.
- Quantity stepper (pill, 56px) + **"Add to cart · €148"** primary (price × qty, 56px) — opens the
  cart drawer. Below: secondary 56px "Buy it now" (Dawn dynamic checkout, restyled to match).
  Stock line: green dot + "In stock in {colour}, ready to ship" 14px `--ww-success`.
- **`ww-delivery-estimate` block** (custom block inside main-product), see §6.2.
- Accordions: Dawn collapsible tabs restyled — 60px rows, 1px borders, 16/500, plus/minus icon:
  Details (open), Materials & care, Shipping & returns.
- Mobile: sticky add-to-cart bar at the bottom (44px thumb, "Daypack · Olive", price, black
  "Add to cart" pill), appears after the main ATC scrolls out of view.

### 6.1 `ww-colour-story` (custom section)
Visual: `03-product-desktop-black.png` (Black) and `03-colour-story-olive.png` (Olive).
- Card radius 28, 1px border, white, grid 1.15fr / 1fr, min-height 640. Left: full-cover image
  of the selected colour, mono pill top-left "NO. 01 — BLACK", 56px colour dot bottom-left with
  a 4px white ring. Right (padding 72/64, vertically centred): mono eyebrow "Colour story ·
  Custom section", H2 48px "{lead} *{italic}*", text 17px max 460, 3-column `<dl>` (Finish /
  Hardware / Pairs with) above a 1px divider, then 3 swatch buttons (28px dots, 48px hit area).
- **Blocks: one per colour** — settings: `option_value` (text, must equal the variant's Color
  value), image, label ("No. 01 — Black"), heading lead, italic word, text, finish, hardware,
  pairs with. Copy for all three colours is in `Product.dc.html` (COLORS object).
- Behaviour: render all blocks, show the one matching the current variant. Subscribe to
  `PUB_SUB_EVENTS.variantChange` and switch on the variant's Color option (cross-fade ≤ 240ms).
  The section's own swatches select the variant in the main picker (click the matching input in
  `variant-selects`/`variant-radios`), so both stay in sync; initial state = selected/first
  available variant. Works with any product that has a Color option; hides itself if no block
  matches.
- Mobile: stacked, image aspect 1/1.05, padding 28/22, H2 30px.

### 6.2 `ww-delivery-estimate` (custom block in main-product)
Visual: buy box in `03-product-desktop-black.png`.
- White card, radius 20, 1px border, padding 24, gap 20. Header: truck icon + "Delivery
  estimate" 16/600, mono "CUSTOM SECTION" tag right.
- "Ship to" label + select (48px, radius 12, bg `--ww-bg`). Zones from a textarea setting, one
  per line `Name|minDays|maxDays|price|carrier`. Defaults:
  `Serbia|1|2|€4.90|Local courier`, `European Union|3|5|€9.90|Tracked, DDP`,
  `United Kingdom|4|6|€14.90|Tracked, duties paid`, `Rest of world|6|10|€24.90|Express, tracked`.
  Remember the choice in `localStorage` (try/catch).
- Two tiles (`--ww-surface-3`, radius 14): "Estimated arrival" → **"Tue 20 Oct – Wed 21 Oct"**
  (17/600) + "1–2 business days"; "Shipping" → price + carrier. Dates = today + min/max
  **business days** (skip Sat/Sun), shipping from today if before cutoff, else from next
  business day. Format `Ddd D Mon` in the store locale (`Intl.DateTimeFormat`).
- Cutoff line: clock icon (accent) + "Order within **2h 15m** to ship today" — countdown to a
  `cutoff_hour` setting (default 16:00, store timezone setting default Europe/Belgrade), updates
  every minute; after cutoff/weekend: "Ships next business day".
- Free-shipping progress: 1px top divider, "Add **€30** more for free shipping" + mono
  "€120 / €150", 8px bar (`--ww-accent` fill on `#ECECF1`). Threshold = setting (default 150, in
  shop currency). Value = `/cart.js` `total_price`; refresh on `PUB_SUB_EVENTS.cartUpdate`. At/over
  threshold: "You've unlocked free shipping" in `--ww-success`, bar `--ww-success-dot`.

### 6.3 `ww-stats`
4 cells, 1px top/bottom borders, cell dividers: "22L / Carry-on friendly volume", "14" / Padded
laptop sleeve", "0.9 kg / Light enough to forget", "30 days / Free returns". Value 36px/500,
label 14.5px. Mobile 2×2 inside a white radius-18 card. Blocks.

### 6.4 `ww-testimonials` — layout "single" (product page)
Eyebrow "Testimonials · Custom section", H2 "Taken the long way *round.*", mono pager +
prev/next (52px) aligned right of the heading. One large card (radius 28, grid 1fr / 320px):
left padding 56/64 — stars 20px + "SAMPLE REVIEW" tag, quote 30px/1.32/-0.015em, reviewer 16/600 +
"Verified demo order · Sep 2026" 14px, progress dots (active 24px pill). Right panel bg = colour
tint: mono "Reviewed product", product image (radius 16) for the review's colour, white bar with
title + "Olive · €148" + arrow → links to the product with that variant. Same section as the
home one with a `layout` select setting. Mobile: card stacked, product row inside the card.

### 6.5 Related — "Pairs well *with.*"
H3 36px, 4-col grid of simple cards (image 4/5 radius 20 + title/price row). Dawn
`related-products` restyled, or a product-list setting.

---

## 7. Cart drawer (Dawn `cart-drawer`)
Visual: `04-cart-drawer-desktop.png`, `04-cart-drawer-mobile.png`.
- Width 480px desktop, full screen on mobile; overlay `--ww-overlay`; `--ww-shadow-drawer`.
- Header: "Your *cart*" 24px + item count 14px, 44px outlined circular close button.
- **Free-shipping bar** (inside the re-rendered drawer markup so it updates after every change):
  white strip, "Add **€30** more for free shipping" + mono "€120 / €150", 8px bar, clock line
  "Order within 2h 15m to ship today" (share the cutoff logic with §6.2). Unlocked state as
  §6.2. Threshold = same theme setting.
- Line items: 96×116 image radius 14, title 16/500 + line total, colour dot + "Olive · €78",
  pill qty stepper (40px), "Remove" underlined text button.
- Upsell row (only while under threshold and the product isn't in the cart): white radius-16
  card, 56px image, mono "Unlocks free shipping", "Tech Organiser · €54", outline "Add" pill →
  adds variant via `/cart/add.js` and re-renders. Product = theme setting `ww_cart_upsell`.
- Footer (white, top border): Shipping row, **Subtotal** 17/600 vs value 22px, "Taxes included.
  Discount codes at checkout.", primary 56px "Checkout · €120", mono note "DEMO STORE – CHECKOUT
  IS DISABLED".

---

## 8. Products & content data

1. Copy `images/*.jpg` into the theme `assets/` and push the theme
   (`shopify theme push --unpublished` or the dev theme). Asset URLs then look like
   `https://<shop>.myshopify.com/cdn/shop/t/<theme-id>/assets/daypack-black.jpg`
   (get them with a quick Liquid loop or `shopify theme info`).
2. In `data/products.csv` replace every `{{ASSET:file.jpg}}` with that public asset URL, then
   import in Admin → Products → Import. 8 products, option **Color** (Black/Sand/Olive), €
   prices, tags drive collections (`backpacks`, `travel`, `totes`, `accessories`, `bestseller`,
   `new`). Vendor "Wander Way (demo)".
   (Alternative if import can't use URLs: upload in Admin → Content → Files and use those URLs.)
3. Collections (automated by tag): Backpacks, Travel, Totes, Accessories; "All" for Shop all.
   Main menu: Shop all · Backpacks · Travel · Accessories.
4. Search & Discovery app: filters Product type (or tag) as "Category", Color, Price,
   Availability.
5. Shipping (Settings → Shipping) to match the estimate block: Serbia €4.90, EU €9.90, UK
   €14.90, RoW €24.90, free over €150. Store currency EUR.
6. Store is a demo: keep it password-protected or label checkout as disabled; the announcement
   bar and footer already say "no real orders".

Image map (which photo is what):

| File | Use |
|---|---|
| `daypack-black.jpg` / `daypack-sand.jpg` / `daypack-olive.jpg` | Transit Daypack variants + colour story |
| `weekender-sand.jpg` | Overnight Weekender, home hero |
| `tote-olive.jpg` / `tote-sand.jpg` | Everyday Tote variants, cart line item |
| `pouch-sand.jpg` | Essentials Pouch |
| `rolltop-sand.jpg` | Roll-top Backpack |
| `duffel-sand.jpg` | Cabin Duffel |
| `sling-olive.jpg` | Crossbody Sling |
| `organiser-black.jpg` | Tech Organiser, daypack gallery "What fits", cart upsell |
| `lifestyle-platform.jpg` | Home editorial banner, daypack gallery #2 |
| `lifestyle-station.jpg` | Home newsletter, daypack gallery #3 |

---

## 9. Definition of done

- [ ] Side-by-side with `reference/screens/*` at 1440 and 390: same layout, spacing, type sizes,
      colours, radii, copy. Use Playwright (or browser devtools) to screenshot the dev theme at
      exactly 1440 and 390 wide and compare page by page; fix differences > ~4px.
- [ ] Swatches on cards swap images; collection colour filter + chips work.
- [ ] Colour story follows the variant picker both ways (Black ↔ Olive shown in the reference).
- [ ] Delivery estimate: zone change updates dates + price; countdown; progress bar reads the
      real cart and updates after add-to-cart.
- [ ] Testimonials carousels: prev/next, wrap, keyboard accessible, "Sample review" on every card.
- [ ] Cart drawer: free-shipping bar updates live, upsell adds, qty/remove work.
- [ ] "Wander Way · DEMO" badge visible on every page; announcement bar + footer link to
      wanderway.rs.
- [ ] `shopify theme check` → 0 offences; Lighthouse mobile performance ≥ 90 on home.
- [ ] All custom sections/blocks editable in the theme editor with sensible defaults; no
      hard-coded copy left in Liquid except schema defaults.
- [ ] PR description lists new files and every edited Dawn core file.
