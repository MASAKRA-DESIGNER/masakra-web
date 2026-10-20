"""One-off: write src/projects/*/index.md from the curated selection.
Keeps texts here so the layout of each gallery (spans, order) is computed from real image sizes."""
import json, os, yaml

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src', 'projects')
dims = json.load(open('/tmp/claude-0/-home-claude/e617e229-ec82-5ab7-b772-398213279947/scratchpad/dims.json'))

def span_for(w, h):
    ar = w / h
    if ar >= 1.25: return 12
    if ar >= 0.6: return 6
    return 4

def pack(items):
    """Order gallery items so rows fill 12 columns; centre leftovers."""
    L = [i for i in items if i['span'] == 12]
    M = [i for i in items if i['span'] == 6]
    S = [i for i in items if i['span'] == 4]
    out = []
    if len(M) % 2 == 1:
        single = M.pop(0); single['start'] = 4
        out += ([L.pop(0)] if L else []) + [single]
    while L or M or S:
        if L: out.append(L.pop(0))
        if len(M) >= 2: out += [M.pop(0), M.pop(0)]
        elif len(M) == 1 and not L and not S:
            m = M.pop(0); m['start'] = 4; out.append(m)
        if len(S) >= 3: out += [S.pop(0), S.pop(0), S.pop(0)]
        elif S and not L and len(M) < 2:
            if len(S) == 2:
                a, b = S.pop(0), S.pop(0); a['start'] = 3; b['start'] = 7; out += [a, b]
            else:
                a = S.pop(0); a['start'] = 5; out.append(a)
        if len(M) == 1 and not L and S:
            m = M.pop(0); m['start'] = 4; out.append(m)
    return out

P = {
'loreal-group': dict(
  title="L'Oréal Group", order=1, featured=True, category='PR packaging & events', tag='PR packaging · Events',
  client="L'Oréal Paris, NYX Professional Makeup, Garnier, Lancôme, Maybelline New York, Essie · Hugo Boss",
  year='2023 — 2026', industry='Beauty & lifestyle', scope=['PR boxes', 'Packaging & dielines', 'Event identity', 'Print'],
  cover_ratio='4-3',
  summary='PR boxes, event worlds and print for global beauty brands in Slovakia and the Czech Republic — built to strict guidelines, made to be opened on camera.',
  alts={'01':'NYX Smushy PR box','02':'NYX Smushy counter display','03':'Lancôme 90 — anniversary cupcake','04':'Garnier PR box','05':'Garnier Fructis Hair Food — dieline','06':"L'Oréal Paris Bounce Up Bar",'07':'Bounce Up Bar — menu','08':"L'Oréal Awards — leaflet",'09':'HUGO Nights — invitation','10':'Maybelline Skytubes — thermal box','11':'Revitalift Laser — PR kit','12':'Elseve Growth Booster — PR kit','13':'Essie — PR box','14':'BOSS — green wall'},
  body="""## Brief
Launch kits, event worlds and printed matter for L'Oréal brands entering the Slovak and Czech market. Every piece follows global brand guidelines to the letter — and still has to feel like an event when it is opened, posted or walked through.

## Work
- PR boxes and seeding kits — NYX Smushy, Garnier, Revitalift Laser, Elseve Growth Booster, Essie, Maybelline Skytubes
- Packaging dielines ready for production
- Event identities — L'Oréal Paris Bounce Up Bar, L'Oréal Awards, Lancôme 90th anniversary
- Invitations and social formats for HUGO Nights (Hugo Boss)

## Partners
Developed with AMI Communications (Slovakia) and WS Czech (Czech Republic).

## Craft
Production-ready files on launch timelines measured in days. [doplň: materiály, technológie tlače, náklad, počet projektov za rok]
"""),
'helfest-2025': dict(
  title='HELFEST 2025', order=2, featured=True, category='Festival identity', tag='Festival · Identity',
  client='HELFEST', year='2025', industry='Music festival', scope=['Key visual', 'Line-up campaign', 'Merch', 'Out-of-home'],
  cover_ratio='4-3',
  summary='Festival identity for HELFEST in Prešov — one illustrated world carried from the main poster to billboards, merch and a full line-up campaign.',
  alts={'01':'HELFEST 2025 — billboard','02':'Main poster','03':'Festival T-shirt','04':'Line-up announcement — cover','05':'Line-up story — Medial Banana','06':'Line-up story — Gleb','07':'Line-up story — Balkan Paradise Orchestra','08':'Line-up story — Fast Food Orchestra','09':'Line-up story — Koza odratá a jež','10':'Line-up story — Show Drsňošov'},
  body="""## Brief
A two-day open-air festival in Prešov–Delňa (22–23 August 2025). The visual had to work as a poster, scale to a billboard and carry dozens of band announcements without losing its character.

## Idea
A dense, hand-illustrated golden world on deep green. The illustration is the frame; the bands sit inside it. Bold yellow labels carry the names, so every announcement reads at a glance in a feed.

## System
- Main poster and full line-up
- Announcement waves — one story per band, same frame, new photo
- Facebook covers, billboard, merch T-shirt

## Outcome
[doplň: návštevnosť, predaj lístkov, reakcie]
"""),
'rytmus': dict(
  title='Rytmus', order=3, featured=True, category='Label identity · Key visuals · Merch', tag='Music · Identity',
  client='Rytmus · Nekonečno & 1 Flow Records · Bengoro', year='[doplň]', industry='Music', scope=['Label identity', 'Key visuals & covers', 'Merch', 'Product'],
  cover_ratio='4-3',
  summary='A long-running collaboration with Rytmus — the identity of his own label, key visuals for releases and films, arena posters and merch.',
  alts={'01':'NEW ERA KONTRAFAKT — O2 arena poster','02':'Nekonečno & 1 Flow Records — logo','03':'Label poster','04':'Logo story','05':'BANDITA — key visual','06':'ČERTO — single cover','07':'Rodina, love & spev — cover','08':'KING FOREVER — O2 Arena Praha poster','09':'BLACKLIST — title','10':'Rytmus energy drink — can','11':'Bengoro Films','12':'Bengoro merch — premium tee','13':'Bengoro merch — JEŽIŠ tee','14':'Most Wanted — merch'},
  body="""## Context
Rytmus is one of the biggest names in Slovak and Czech hip-hop. The work covers his label, his releases and the products around them.

## Label
**Nekonečno & 1 Flow Records** — infinity as constant growth, one as a single unmistakable signature. Minimal, timeless type built to outlast trends, used across releases, merch and digital.

## Key visuals
Posters and covers for releases and projects — BANDITA (Bengoro Films), ČERTO, Rodina, love & spev, BLACKLIST, KING FOREVER at O2 Arena Prague and NEW ERA KONTRAFAKT at O2 arena.

## Merch & product
Bengoro merch collections, Most Wanted, and a Rytmus energy drink can.

## Outcome
[doplň: dosah, predaj merchu, vydania]
"""),
'baba-yaga': dict(
  title='Baba Yaga', order=4, featured=True, category='Fight & streetwear collection', tag='Fight & streetwear',
  client='Václav “Baba Yaga” Mikulášek', year='2025 — 2026', industry='Combat sports', scope=['Collection design', 'Graphics', 'Rashguards', 'Merch'],
  cover_ratio='4-3',
  summary='Collections for fighter Václav Mikulášek — three moods, one X. Approved in one round, zero revisions.',
  alts={'01':'Baba Yaga — tee and cap','02':'SMILE — black tee','03':'RED — white tee','04':'RED — black tee','05':'GREEN — white tee','06':'JOKER tee','07':'Rashguard — worn','08':'Rashguard — front and back','09':'UCHO — poster','10':'UCHO — black tee','11':'Summer 2026 — tracksuit'},
  body="""## Brief
A new collection that leaves the darker punk look of the previous drop behind. A change of direction, not a refresh.

## Idea
Three moods — **fight energy, street, lifestyle** — held together by one symbol: an X evolved from the smiley icon.

## Range
Tees, caps, rashguards and fight shorts, the UCHO tee and poster, and the summer 2026 line.

## Outcome
Designed and approved in one round. No revisions. Available at bangermerch.cz. [doplň: predaj, sold-out, čísla]
"""),
'helenine-oci': dict(
  title='Heľenine Oči', order=5, category='Logo · Tour campaign', tag='Logo · Music',
  client='Heľenine Oči', year='2025 — 2026', industry='Music', scope=['Logo redesign', 'Tour campaign', 'Merch'],
  summary='A seven-piece band from Prešov, 100+ shows a year. A new script logotype — clearer, not louder — and the campaign for an eight-country tour.',
  alts={'01':'New logotype','02':'Brand board','03':'Merch tee','04':'8 Flags Tour 2027 — key visual','05':'Tour story — Bratislava','06':'Tour story — London','07':'Tour story — Prague','08':'Tour event cover — Bratislava'},
  body="""## Context
Heľenine Oči is a seven-piece band from Prešov, active since 1999 — rock, ska, reggae, folk and metal, over 100 live shows a year.

## Problem
The old logo was a detailed illustration. Strong on posters and merch, but hard to scale and too complex for digital and everyday use.

## Solution
A custom script logotype that keeps the handwritten character and adds the sharper edge of rock. Its structure loosely follows the shape of an electric guitar, on a strong horizontal base.

## 8 Flags Tour 2027
One key visual, adapted for every stop — Slovakia, Czechia, Austria, Germany, Switzerland, Romania and the UK. Each city gets its own story and event cover, with the date, venue and flag swapped into the same frame.

## Outcome
One mark that works on merch, the tour van, digital platforms and at small sizes — without losing the band's character.
"""),
'mikolux': dict(
  title='MIKOLUX', order=6, category='Brand identity', tag='Identity system · Energy',
  client='MIKOLUX', year='2025', industry='Energy solutions', scope=['Brand identity', 'Logo', 'Pattern system', 'Print & uniforms'],
  summary='An identity for an energy company working with air, water and solar — one wave-shaped M carries the whole system.',
  alts={'01':'Business cards','02':'Logo — horizontal','03':'Symbol','04':'The M wave in 3D','05':'Flow','06':'City light','07':'Van and uniform','08':'Uniform'},
  body="""## Context
MIKOLUX installs air, water and solar systems. The brand had to look precise and reliable on vans, documents and screens — without the visual noise typical of the sector.

## Idea
Air, water and light treated as one continuous flow. Technology that works quietly in the background, the way it should.

## Logo
A fluid, wave-shaped **M** — the initial and the movement of energy in one stroke. The wordmark uses rounded forms that follow the line of the symbol.

## System
- Repeating the M wave builds a pattern, used as a quiet background layer in print and digital.
- Technical blue palette with one blue-violet accent.
- Proxima Nova: soft enough for the symbol, clear enough for technical copy.

## Credits
Brand identity by MASAKRA, in collaboration with IS Agency.
"""),
'sumilaska': dict(
  title='SUMILASKA', order=7, category='Brand identity', tag='Identity · Retail',
  client='SUMILASKA Kvety', year='[doplň]', industry='Florist', scope=['Logo', 'Visual identity', 'Storefront', 'Social'],
  summary='Identity for a flower shop in Prešov — an angel and a rose in one mark, deep green, and a voice that speaks to people, not to products.',
  alts={'01':'Facebook cover','02':'Logo','03':'Storefront','04':'Kvety & Láska','05':'T-shirt','06':'Story — funeral arrangements','07':'Story — name days','08':'Story — Frederika'},
  body="""## Context
A family flower shop on Čergovská street in Prešov. [doplň: čo bolo pred redizajnom, prečo nová značka]

## Logo
Angel wings around a rose — love and remembrance in one mark, because a florist works with both. Set with a classic serif wordmark.

## System
Deep green as the ground, warm white for type, flowers as the only colour. The same frame carries everyday posts, seasonal campaigns and the storefront sign.

## Social
A name-day series — *Komu dnes patrí meno?* — turns the calendar into a reason to send flowers every day.

## Outcome
[doplň: reakcie, predaj, sledovatelia]
"""),
'funradio-30': dict(
  title='FUNRADIO 30', order=8, category='Anniversary merch', tag='Merch · Media',
  client='Funradio', year='2020 — 2021', industry='Radio', scope=['Merch collection', 'Show logos', 'Embroidery', 'Social'],
  summary='Thirty years of Funradio in one stickerbomb — every show, host and in-joke on one surface, then on hoodies, tees and patches.',
  alts={'01':'Hoodies','02':'FR30 stickerbomb','03':'FR30 — framed print','04':'Show logos','05':'Merch — photo','06':'Merch — host','07':'Born to be Fun','08':'Lovein Fun — embroidered patch','09':'Zdeno z Popradu — logo'},
  body="""## Brief
A merch collection for the 30th anniversary of Funradio — something listeners would wear, not just collect.

## Idea
Three decades of shows, hosts and running jokes packed into one stickerbomb. The history of the station becomes the print.

## Work
- FR30 stickerbomb artwork for tees, hoodies and framed prints
- Logos for shows and segments — Zdeno z Popradu, Café del Fun, Telefun, Fun Top Fuj
- Embroidered patches and the *Born to be Fun* line

## Outcome
[doplň: predaj, reakcie poslucháčov]
"""),
'scorpion': dict(
  title='Scorpion — Patrik Záděra', order=9, category='Fighter merch', tag='Fight apparel',
  client='Patrik “Scorpion” Záděra · Spejbl Gym Praha', year='2026', industry='Combat sports', scope=['T-shirt & hoodie', 'Typography', 'Monogram', 'Launch posts'],
  cover_ratio='4-5',
  summary='Fighter merch built around one nickname — gothic type in scorpion yellow, a split face and a personal monogram. Approved without revisions.',
  alts={'01':'Tee in the locker room','02':'Back print','03':'Tee — front and back','04':'Hoodie — front and back','05':'Worn','06':'Patrik with the tee','07':'New drop — post','08':'Giveaway — post'},
  body="""## Type
Gothic lettering in scorpion yellow. Toxic, not luxury.

## Key visual
A split face: half Patrik, half Scorpion.

## Monogram
A PZ badge with his birth year built into the mark.

## Details
Spejbl Gym logo on the front. Launch posts for the drop and a signed-tee giveaway. [doplň: materiál, technológia potlače]

## Outcome
Approved without revisions.
"""),
}

for slug, d in P.items():
    files = dims[slug]
    cover = files[0]
    items = []
    for f, w, h in files[1:]:
        n = f[:2]
        items.append({'src': f, 'alt': d['alts'].get(n, ''), 'w': w, 'h': h, 'span': span_for(w, h)})
    gallery = pack(items)
    fm = {k: d[k] for k in ['title', 'order', 'category', 'tag', 'client', 'year', 'industry', 'scope', 'summary'] if k in d}
    if d.get('featured'): fm['featured'] = True
    fm['cover'] = {'src': cover[0], 'alt': d['alts'].get('01', d['title']), 'ratio': d.get('cover_ratio', '16-9')}
    fm['gallery'] = gallery
    text = '---\n' + yaml.safe_dump(fm, allow_unicode=True, sort_keys=False, width=1000) + '---\n' + d['body'].lstrip()
    open(os.path.join(ROOT, slug, 'index.md'), 'w').write(text)
    print(slug, len(gallery), [g['span'] for g in gallery])
