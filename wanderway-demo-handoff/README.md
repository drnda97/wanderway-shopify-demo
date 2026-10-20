# Wander Way demo store — handoff paket

**Kako se koristi (2 minuta):**
1. Raspakuj ovaj folder u root svog theme repoa, tako da putanja bude `./wanderway-demo-handoff/`.
2. Otvori Claude Code u repou i nalepi ceo sadržaj fajla `PROMPT.md`.
3. Kad završi, uradi ručne korake u Shopify Adminu sa liste koju ti napravi (import proizvoda iz `data/products.csv`, kolekcije, meni, filteri, dostava).

**Šta je unutra**
```
PROMPT.md               prompt za Claude Code (copy/paste)
HANDOFF.md              kompletna specifikacija: Dawn mapiranje, sekcije, ponašanje, checklist
theme-starter/          gotovi fajlovi za temu:
  assets/ww-tokens.css    svi design tokeni + helper klase + "Dawn bridge"
  assets/*.woff2          Hanken Grotesk + JetBrains Mono (latin + latin-ext, OFL)
  snippets/ww-fonts.liquid  @font-face za fontove iz assets/
images/                 13 fotografija (Unsplash, optimizovane) + CREDITS.md
data/products.csv       8 proizvoda × 3 boje za Shopify import
reference/
  screens/              screenshotovi svih ekrana (1440 i 390), cilj za 1:1 poređenje
  html/                 interaktivni preview svakog ekrana (dupli klik, radi offline)
  source/               originalni dizajn sa tačnim vrednostima i svim tekstovima
```

`reference/html/dc-preview.js` služi samo za preview i ne ide u temu.
