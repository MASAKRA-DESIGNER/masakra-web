# masakra.sk

Portfólio MASAKRA — statický web, ktorý sa skladá z jednoduchých textových súborov.

## Ako to funguje
- `src/projects/<nazov>/index.md` — jeden projekt = jeden priečinok. Hore sú údaje (názov, klient, rok, rozsah, obrázky), dole text case study rozdelený nadpismi `## Nadpis`.
- Fotky projektu sa dávajú do toho istého priečinka (ideálne `.webp`, šírka 2400 px).
- `src/site.json` — kontakt, klienti v páse, cena „od“, citát klienta.
- Po každom uložení na GitHub sa web sám zostaví a zverejní (GitHub Actions → GitHub Pages).

## Nový projekt
1. Skopíruj priečinok niektorého projektu a premenuj ho (malé písmená, pomlčky).
2. Uprav údaje a text v `index.md`, pridaj fotky a doplň `src:` pri `cover` a v `gallery`.
3. `featured: true` = projekt je vo veľkej mriežke na homepage (max. 4). Ostatné idú do zoznamu.
4. `order:` určuje poradie. `draft: true` = projekt sa na živom webe neukáže.

Text v hranatých zátvorkách `[doplň: …]` sa v náhľade zvýrazní, aby nič nezostalo zabudnuté.

## Lokálne
```
npm ci
node tools/build.js          # náhľad (aj koncepty)
node tools/build.js --prod   # ako živý web
```
Výsledok je v priečinku `dist/`.

## Doména
Až keď bude všetko schválené: vytvoriť `src/CNAME` s obsahom `www.masakra.sk` a nastaviť DNS vo Websupporte (postup je v projektovom pláne).
