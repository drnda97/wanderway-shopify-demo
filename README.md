# Wander Way – Shopify demo theme

A demo theme by **Milan Drndarevic / [Wander Way](https://wanderway.rs)** showing custom Shopify theme work in Liquid, JavaScript and CSS.

Built on top of Shopify's open-source reference theme [Dawn](https://github.com/Shopify/dawn) (v16.0.0, see `LICENSE.md`).
Dawn is untouched; all custom work lives in the `ww-*` files listed below.

## Custom sections

| Section | Files | What it shows |
| --- | --- | --- |
| **WW: Color story** | `sections/ww-color-story.liquid`, `assets/ww-color-story.{js,css}` | A different image and copy for each product colour, swapped instantly when the shopper picks a colour. Hooks into Dawn's `PUB_SUB_EVENTS.variantChange`, so it works with every picker type and makes no extra requests. Content is edited per colour in the theme editor. |
| **WW: Delivery estimate** | `sections/ww-delivery-estimate.liquid`, `assets/ww-delivery-estimate.{js,css}` | Shipping-zone picker pre-selected from the visitor's country (`localization`), delivery window in business days, same-day cut-off countdown, and a free-shipping progress bar that updates with the selected variant's price. Respects the store's money format. |
| **WW: Testimonials** | `sections/ww-testimonials.liquid`, `assets/ww-testimonials.{js,css}` | Library-free scroll-snap carousel with keyboard support, ARIA labels, reduced-motion support, an average-rating summary computed in Liquid, and an optional linked product per review. |

The product template (`templates/product.json`) adds the delivery estimate and colour story below the main product section; the home page (`templates/index.json`) adds the testimonials.
Testimonials in this demo are clearly labelled placeholders, not real reviews.

## Principles

- No changes to Dawn's core files, so the theme can still be updated.
- Merchant-editable: every text, rate and image is a section or block setting.
- Accessible: semantic markup, focus states, `aria-live` updates, `prefers-reduced-motion`.
- Lightweight: vanilla JS custom elements, CSS and JS loaded only where a section is used.
- Passes Shopify Theme Check.

## Run locally

```bash
npm install -g @shopify/cli
shopify theme dev --store your-store.myshopify.com
```

---
Contact: drndarevicmilan97@gmail.com · https://wanderway.rs
