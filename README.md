# masakra.sk

Portfólio MASAKRA — statický web, ktorý sa skladá z jednoduchých textových súborov.

## Ako to funguje
- `src/projects/<nazov>/index.md` — jeden projekt = jeden priečinok. Hore sú údaje (názov, klient, rok, rozsah, obrázky), dole text case study rozdelený nadpismi `## Nadpis`.
- Fotky projektu sa dávajú do toho istého priečinka (ideálne `.webp`, šírka 2400 px).
- `src/site.json` — kontakt, klienti v páse, cena „od“, citát klienta.
- Po každom uložení na GitHub sa web sám zostaví a zverejní (GitHub Actions → GitHub Pages).

## Jazyky
- Angličtina je hlavná (masakra.sk/), slovenčina beží pod masakra.sk/sk/. Prepínač EN / SK je v hlavičke a vždy vedie na tú istú stránku v druhom jazyku.
- Texty webu (menu, homepage, kontakt) sú v `src/texts.json` — blok `en` a blok `sk`.
- Cena „od“ a citát klienta po slovensky sú v `src/site.json` v časti `sk`.
- Slovenská verzia projektu je v `src/projects/<nazov>/index.sk.md`. Stačí v nej uviesť to, čo sa prekladá (category, tag, industry, scope, summary, cover.alt) a text pod čiarou. Obrázky a ostatné údaje sa berú z anglického `index.md`.
- Ak projekt slovenský súbor nemá, na /sk/ sa ukáže anglický text (build to vypíše).

## Nový projekt
1. Skopíruj priečinok niektorého projektu a premenuj ho (malé písmená, pomlčky).
2. Uprav údaje a text v `index.md` (anglicky) a v `index.sk.md` (slovensky), pridaj fotky a doplň `src:` pri `cover` a v `gallery`.
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
