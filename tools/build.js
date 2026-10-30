#!/usr/bin/env node
// MASAKRA site generator.
// Usage: node tools/build.js [--prod]
//   --prod  leaves out projects marked `draft: true` (use for the live site)
// Output goes to ./dist. Every link is relative, so the folder works on any host.
// Two languages: English at the root (primary), Slovak under /sk/.
// UI texts live in src/texts.json; a project's Slovak version in src/projects/<slug>/index.sk.md.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const PROD = process.argv.includes('--prod');

const siteBase = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf8'));
const TEXTS = JSON.parse(fs.readFileSync(path.join(SRC, 'texts.json'), 'utf8'));
const LANGS = { en: '', sk: 'sk/' };            // language → folder prefix
let L = TEXTS.en, LANG = 'en', site = siteBase;   // set per language in the build loop
function setLang(lang) {
  LANG = lang; L = TEXTS[lang];
  const { sk, ...base } = siteBase;
  site = lang === 'en' ? base : { ...base, ...(siteBase[lang] || {}) };
}
const logoBlack = inlineSvg('logo-black.svg');
const logoWhite = inlineSvg('logo-white-volt.svg');

// ---------- helpers ----------
function inlineSvg(file) {
  const raw = fs.readFileSync(path.join(SRC, 'assets', file), 'utf8');
  return raw.replace(/<svg[^>]*viewBox="([^"]+)"[^>]*>/, '<svg viewBox="$1" role="img" aria-label="MASAKRA" focusable="false">');
}
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const todo = (html) => html.replace(/\[(doplň|doplniť|TODO)[^\]]*\]/gi, (m) => `<span class="todo">${m}</span>`);
const txt = (s) => todo(esc(s));
const pad2 = (n) => String(n).padStart(2, '0');
const arrowNE = '<svg class="arrow" aria-hidden="true" width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 13L13 5M6 5h7v7"/></svg>';
function rmrf(p) { fs.rmSync(p, { recursive: true, force: true }); }
function copyDir(from, to, filter = () => true) {
  fs.mkdirSync(to, { recursive: true });
  for (const f of fs.readdirSync(from)) {
    const a = path.join(from, f), b = path.join(to, f);
    if (fs.statSync(a).isDirectory()) copyDir(a, b, filter);
    else if (filter(f)) fs.copyFileSync(a, b);
  }
}
function write(rel, html) {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, html);
}

// ---------- projects ----------
function loadProjects() {
  const dir = path.join(SRC, 'projects');
  const list = [];
  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, 'index.md');
    if (!fs.existsSync(file)) continue;
    const { data, content } = matter(fs.readFileSync(file, 'utf8'));
    if (PROD && data.draft) continue;
    const p = { slug, ...data, body: content, i18n: {} };
    for (const lang of Object.keys(LANGS)) {
      const f = path.join(dir, slug, `index.${lang}.md`);
      if (fs.existsSync(f)) { const t = matter(fs.readFileSync(f, 'utf8')); p.i18n[lang] = { ...t.data, body: t.content }; }
    }
    list.push(p);
  }
  list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  list.forEach((p, i) => { p.num = pad2(i + 1); });
  return list;
}
// Project in the current language: translated fields override the English ones.
function loc(p) {
  const t = p.i18n[LANG];
  if (!t) return p;
  const out = { ...p, ...t };
  if (t.cover) out.cover = { ...p.cover, ...t.cover };
  if (t.alts && p.gallery) out.gallery = p.gallery.map((g, i) => (t.alts[i] ? { ...g, alt: t.alts[i] } : g));
  if (!t.body || !t.body.trim()) out.body = p.body;
  return out;
}
function sections(md) {
  // Split markdown on "## Heading" into [{title, html}]
  const out = [];
  let cur = null;
  for (const line of md.split('\n')) {
    const m = line.match(/^##\s+(.*)/);
    if (m) { if (cur) out.push(cur); cur = { title: m[1].trim(), md: '' }; }
    else if (cur) cur.md += line + '\n';
  }
  if (cur) out.push(cur);
  return out.map((s) => ({ title: s.title, html: todo(marked.parse(s.md.trim())) }));
}
function media(img, prefix, label, ratio) {
  const r = 'r-' + (img?.ratio || ratio || '4-3');
  if (img && img.src) {
    return `<div class="media ${r}"><img src="${prefix}${esc(img.src)}" alt="${esc(img.alt || '')}" loading="lazy" decoding="async"></div>`;
  }
  return `<div class="media ${r}"><div class="ph"><span class="mono">${txt(label || img?.alt || 'Image')}</span></div></div>`;
}
function video(v, prefix, ratio, cls = '') {
  // Muted looping clip. Loaded and played only while on screen (assets/js/main.js); the poster shows until then.
  const r = ratio ? ` r-${ratio}` : '';
  const poster = v.poster ? ` poster="${prefix}${esc(v.poster)}"` : '';
  return `<div class="media vid${r}${cls}"><video muted loop playsinline preload="none"${poster} data-src="${prefix}${esc(v.video)}" aria-label="${esc(v.alt || '')}"></video></div>`;
}
function natural(img, prefix) {
  // Gallery item: a video loop, a cropped image (ratio set) or an image at its own proportions.
  if (img.video) return video(img, prefix, img.ratio || '1-1');
  if (img.src && img.ratio) return `<div class="media r-${img.ratio}"><img src="${prefix}${esc(img.src)}" alt="${esc(img.alt || '')}" loading="lazy" decoding="async"${img.pos ? ` style="object-position:${esc(img.pos)}"` : ''}></div>`;
  if (!img.src) return media(img, prefix, img.alt, img.ratio || '16-9');
  const wh = img.w && img.h ? ` width="${img.w}" height="${img.h}"` : '';
  return `<div class="media natural"><img src="${prefix}${esc(img.src)}" alt="${esc(img.alt || '')}"${wh} loading="lazy" decoding="async"></div>`;
}
// ---------- layout ----------
// `root` = relative path to the site root (where assets/ and work/<slug>/ images live).
// `base` = relative path to the home folder of the current language (root for EN, root + 'sk/' for SK).
// `page` = the page's path inside a language folder ('index.html' or 'work/<slug>.html').
const abs = (lang, page) => `${site.url}/${LANGS[lang]}${page === 'index.html' ? '' : page}`;

function head({ title, description, root, page }) {
  const alternates = Object.keys(LANGS).map((l) => `<link rel="alternate" hreflang="${l}" href="${esc(abs(l, page))}">`).join('\n');
  return `<!doctype html>
<html lang="${L.htmlLang}" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(abs(LANG, page))}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${esc(abs('en', page))}">
<meta property="og:type" content="website">
<meta property="og:locale" content="${L.ogLocale}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(abs(LANG, page))}">
<meta property="og:image" content="${esc(site.url)}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#000000">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${root}assets/icon-180.png">
<link rel="preload" href="${root}assets/fonts/space-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/geist.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}assets/css/main.css">
<script defer src="${root}assets/js/main.js"></script>
</head>
<body>
<a class="skip" href="#main">${esc(L.skip)}</a>`;
}
function langSwitch(root, page) {
  // EN / SK — the current language is plain text, the other one links to the same page in that language.
  const items = Object.keys(LANGS).map((l) => (l === LANG
    ? `<span aria-current="true">${l.toUpperCase()}</span>`
    : `<a href="${root}${LANGS[l]}${page}" hreflang="${l}" lang="${l}" title="${esc(TEXTS[l].langName)}">${l.toUpperCase()}</a>`));
  return `<div class="lang mono" role="group" aria-label="${esc(L.langLabel)}">${items.join('<span class="sep" aria-hidden="true">/</span>')}</div>`;
}
function header(root, base, home, page) {
  const h = home ? '' : `${base}index.html`;
  return `<header class="wrap site-header">
<a class="logo" href="${base}index.html" aria-label="${esc(L.home)}">${logoBlack}</a>
<nav class="nav" aria-label="Primary">
<a class="mark hide-m" href="${h}#work">${esc(L.navWork)}</a>
<a class="mark hide-m" href="${h}#agencies">${esc(L.navAgencies)}</a>
<a class="mark hide-m" href="${h}#approach">${esc(L.navApproach)}</a>
${langSwitch(root, page)}
<a class="btn sm" href="${h}#contact">${esc(L.navCta)} <span class="arrow" aria-hidden="true">→</span></a>
</nav>
</header>`;
}
function contactAndFooter() {
  return `<section id="contact" class="dark contact">
<div class="wrap section">
<span class="mono muted">${esc(L.contactLabel)}</span>
<h2 class="hero-h reveal">${L.contactTitle}</h2>
<a class="mail link-dark" href="mailto:${esc(site.email)}">${esc(site.email)} <svg class="arrow" aria-hidden="true" width="40" height="40" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 13L13 5M6 5h7v7"/></svg></a>
<p class="contact-note">${esc(L.contactNote)}</p>
</div>
<footer class="wrap site-footer">
<span class="mono muted">© ${new Date().getFullYear()} ${esc(site.name)} — ${esc(site.owner)} · ${esc(site.location)}</span>
<nav aria-label="Social">
<a class="link-dark plain mono" href="${esc(site.instagram)}">Instagram</a>
<a class="link-dark plain mono" href="${esc(site.facebook)}">Facebook</a>
<a class="link-dark plain mono" href="#top">${esc(L.backTop)}</a>
</nav>
</footer>
</section>
</body>
</html>`;
}

// ---------- pages ----------
function homePage(projects) {
  const root = LANGS[LANG] ? '../' : '';
  const base = '';
  const page = 'index.html';
  const featured = projects.filter((p) => p.featured).slice(0, 8);
  const rest = projects.filter((p) => !featured.includes(p));
  const pattern = [{ span: 's6', off: false }];
  const cards = featured.map((p, i) => {
    const pt = pattern[0];
    const ratio = '4-3';
    const cover = p.cover && p.cover.src ? { ...p.cover, src: `work/${p.slug}/${p.cover.src}` } : null;
    return `<a class="work-card ${pt.span}${pt.off ? ' offset' : ''} reveal" href="${base}work/${p.slug}.html">
${media(cover ? { ...cover, ratio } : null, root, `Image · ${p.cover?.alt || p.title}`, ratio).replace(/<\/div>$/, p.cover && p.cover.video ? `<video class="hover-vid" muted loop playsinline preload="none" data-src="${root}work/${p.slug}/${esc(p.cover.video)}" aria-hidden="true"></video></div>` : '</div>')}
<div class="card-meta"><div class="card-title"><span class="mono muted">${p.num}</span><span class="t">${txt(p.title)}</span></div>
<div class="card-tag"><span class="mono muted">${txt(p.tag || p.category)}</span>${arrowNE}</div></div>
</a>`;
  }).join('\n');
  const rows = rest.map((p) => `<a class="idx-row" href="${base}work/${p.slug}.html"><span class="l"><span class="mono muted">${p.num}</span><span class="t">${txt(p.title)}</span></span><span class="r"><span class="mono muted">${txt(p.tag || p.category)}</span><span aria-hidden="true">→</span></span></a>`).join('\n');
  const clients = site.clients.map((c) => `<span>${esc(c)}</span><b></b>`).join('');
  const set = (hidden) => `<div class="marquee-set"${hidden ? ' aria-hidden="true"' : ''}><span class="mono muted">${esc(L.clients)}</span>${clients}</div>`;
  const clock = (tz, city) => `<div class="clock" data-tz="${tz}"><span class="mono muted">${esc(city)}</span><span class="time"><span class="h">--</span><span class="colon">:</span><span class="m">--</span></span></div>`;
  const step = (n, h, p) => `<div class="grid12 step"><span class="mono muted s3">${esc(L.apStep)} ${n}</span><h3 class="mid-h s4">${esc(h)}</h3><p class="s5">${esc(p)}</p></div>`;
  const pillar = (n, h, p) => `<div class="s4 pillar reveal"><span class="mono n">${n}</span><h3 class="mid-h">${esc(h)}</h3><p>${esc(p)}</p></div>`;

  return `${head({ title: L.title, description: site.description, root, page })}
${header(root, base, true, page)}
<main id="main">
<section id="top" class="wrap hero">
<h1 class="hero-h">
<span class="rise d2" style="display:block">${esc(L.heroL1)}</span>
<span class="rise d3 soft" style="display:block">${esc(L.heroL2)}<span class="sq pop" aria-hidden="true"></span></span>
</h1>
<div class="grid12 hero-foot rise d4">
<p class="s6">${esc(L.heroP)}</p>
<div class="s6 hero-cta">
<a class="btn" href="#work">${esc(L.heroCta)} <span class="arrow" aria-hidden="true">→</span></a>
<a class="mark" href="#agencies">${esc(L.heroAgencies)}</a>
</div>
</div>
</section>

<section class="marquee rise d5" aria-label="${esc(L.clients)}"><div class="marquee-track">${set(false)}${set(true)}</div></section>

<section class="wrap section">
<div class="grid12">
<span class="mono muted s3 label-col">${esc(L.posLabel)}</span>
<p class="big-h s9 reveal">${L.posText}</p>
</div>
</section>

<section id="work" style="padding-bottom:72px">
<div class="wrap"><div class="sec-head stack-m"><span class="mono">${esc(L.workLabel)}</span><span class="mono muted">${esc(L.workCats)}</span></div></div>
<div class="wrap wide"><div class="grid12 work-grid">
${cards}
</div></div>
${rows ? `<div class="wrap"><div class="idx">\n${rows}\n</div></div>` : ''}
</section>

<section id="agencies" class="dark agencies">
<div class="wrap section">
<div class="grid12" style="margin-bottom:96px">
<span class="mono muted s3 label-col">${esc(L.agLabel)}</span>
<div class="s9">
<h2 class="big-h reveal">${esc(L.agTitle)}<span class="sq" aria-hidden="true"></span></h2>
<p class="lead">${esc(L.agLead)}</p>
</div>
</div>
<div class="grid12 pillars">
${pillar('01', L.ag1h, L.ag1)}
${pillar('02', L.ag2h, L.ag2)}
${pillar('03', L.ag3h, L.ag3)}
</div>
<div class="clocks">
<div class="clocks-set">
${clock('Europe/Bratislava', L.agCity)}
${clock('America/New_York', 'New York')}
${clock('America/Los_Angeles', 'Los Angeles')}
</div>
<a class="link-dark" href="#contact">${esc(L.agCta)}</a>
</div>
</div>
</section>

<section id="approach" class="wrap section" style="padding-bottom:120px">
<div class="grid12" style="margin-bottom:80px">
<span class="mono muted s3 label-col">${esc(L.apLabel)}</span>
<h2 class="big-h s9 reveal">${L.apTitle}</h2>
</div>
<div class="steps">
${step('01', L.ap1h, L.ap1)}
${step('02', L.ap2h, L.ap2)}
${step('03', L.ap3h, L.ap3)}
</div>
</section>

<section class="wrap" style="padding-bottom:168px">
<div class="grid12" style="row-gap:48px">
<span class="mono muted s3" style="padding-top:8px">${esc(L.svLabel)}</span>
<div class="s5 services">${L.svItems.map((x) => `<span>${esc(x)}</span>`).join('')}</div>
<div class="s4 price"><span class="mono muted">${esc(L.svFrom)}</span><span class="v">${txt(site.startingPrice)}</span><span class="n">${esc(L.svNote)}</span></div>
</div>
</section>

<section class="wrap" style="padding-bottom:168px">
<figure class="grid12 quote">
<span class="mono muted s3">${esc(L.quoteLabel)}</span>
<div class="s9">
<blockquote class="mid-h">“${txt(site.quote.text)}”</blockquote>
<figcaption class="mono muted" style="margin-top:32px">${txt(site.quote.name)} — ${txt(site.quote.role)}</figcaption>
</div>
</figure>
</section>
</main>
${contactAndFooter()}`;
}

function projectPage(p, next) {
  const root = LANGS[LANG] ? '../../' : '../';
  const base = '../';
  const page = `work/${p.slug}.html`;
  const secs = sections(p.body);
  const meta = [
    [L.csClient, p.client], [L.csAgency, p.agency], [L.csYear, p.year], [L.csScope, (p.scope || []).join(', ')]
  ].filter(([, v]) => v);
  const img = `${root}work/${p.slug}/`;
  const film = p.hero && p.hero.video
    ? `<div class="cs-film"><video autoplay muted loop playsinline preload="auto" poster="${img}${esc(p.hero.poster || '')}" src="${img}${esc(p.hero.video)}" aria-label="${esc(p.hero.alt || p.title)}"></video></div>` : '';
  const band = p.brand ? ` band" style="--b-bg:${esc(p.brand.bg)};--b-fg:${esc(p.brand.fg || '#000')}` : '';
  const results = (p.results || []).length
    ? `<section class="wrap cs-results"><div class="grid12"><h2 class="mono muted s3">${esc(L.csResults)}</h2><div class="s9 results">${p.results.map((r) => `<div class="res reveal"><span class="v">${txt(r.value)}</span><span class="mono muted">${txt(r.label)}</span></div>`).join('')}</div></div></section>` : '';
  const quote = p.quote && p.quote.text
    ? `<section class="wrap cs-quote"><figure class="grid12 quote"><span class="mono muted s3">${esc(L.quoteLabel.replace(/^\(\d+\)\s*/, ''))}</span><div class="s9"><blockquote class="mid-h">“${txt(p.quote.text)}”</blockquote><figcaption class="mono muted" style="margin-top:32px">${txt(p.quote.name)}${p.quote.role ? ` — ${txt(p.quote.role)}` : ''}</figcaption></div></figure></section>` : '';
  const cover = p.cover && p.cover.src ? media({ ...p.cover, src: `${img}${p.cover.src}`, ratio: p.cover.ratio || '16-9' }, '', '', '16-9')
    : media(null, '', `Cover · ${p.cover?.alt || p.title}`, '16-9');
  const gallery = (p.gallery || []).map((g) => {
    const span = g.span || 12;
    const pos = g.start ? ` style="grid-column:${g.start} / span ${span}"` : '';
    const im = g.video ? { ...g, video: `${img}${g.video}`, poster: g.poster ? `${img}${g.poster}` : '' } : g.src ? { ...g, src: `${img}${g.src}` } : g;
    return `<figure class="s${span}${g.start ? ' at' : ''} reveal"${pos}>${natural(im, '')}${g.caption ? `<figcaption class="mono muted">${txt(g.caption)}</figcaption>` : ''}</figure>`;
  }).join('\n');
  const desc = (p.summary || site.description).replace(/\[[^\]]*\]/g, '').trim() || site.description;

  return `${head({ title: `${p.title} — MASAKRA`, description: desc, root, page })}
${header(root, base, false, page)}
<main id="main">
${film}
<section class="cs-hero${band}" id="top"><div class="wrap">
<a class="mark mono cs-back rise d1" href="${base}index.html#work">${esc(L.csBack)}</a>
<div class="rise d1"><span class="mono muted">${esc(L.csCase)} ${p.num} · ${txt(p.category || '')}</span></div>
<h1 class="cs-title rise d2">${txt(p.title)}<span class="sq pop" aria-hidden="true"></span></h1>
${p.summary ? `<p class="cs-summary rise d3">${txt(p.summary)}</p>` : ''}
<div class="cs-meta grid12 rise d4">
${meta.map(([k, v]) => `<div class="item s3"><span class="mono muted">${esc(k)}</span><span class="sg" style="font-size:20px;font-weight:500;letter-spacing:-.01em;line-height:1.3">${txt(v)}</span></div>`).join('\n')}
</div>
</div></section>
${film ? '' : `<div class="wrap wide cs-cover rise d5">${cover}</div>`}
<section class="wrap cs-body">
${secs.map((s) => `<div class="grid12 cs-sec reveal"><h2 class="mono s3">${txt(s.title)}</h2><div class="content s9">${s.html}</div></div>`).join('\n')}
</section>
${gallery ? `<section class="wrap wide"><div class="grid12 gallery">\n${gallery}\n</div></section>` : ''}
${results}
${quote}
<section class="wrap">
<a class="next" href="${next.slug}.html"><span class="mono muted">${esc(L.csNext)}</span><br><span class="t">${txt(next.title)} <span aria-hidden="true">→</span></span></a>
</section>
</main>
${contactAndFooter()}`;
}

function notFound() {
  // 404 lives at the site root on GitHub Pages; absolute paths so it works at any URL depth.
  const root = '/';
  return `${head({ title: 'Not found — MASAKRA', description: site.description, root, page: 'index.html' })}
${header(root, root, false, 'index.html').replace(/href="\/index.html#/g, 'href="/#')}
<main id="main" class="wrap section">
<span class="mono muted">404</span>
<h1 class="hero-h" style="margin-top:32px">Nothing here<span class="sq" aria-hidden="true"></span></h1>
<p style="margin-top:40px"><a class="btn" href="/">Back to home <span class="arrow" aria-hidden="true">→</span></a></p>
</main>
</body></html>`;
}

function redirect(to) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MASAKRA</title><meta name="robots" content="noindex"><link rel="canonical" href="${esc(site.url)}/${to}"><meta http-equiv="refresh" content="0; url=/${to}"></head><body><a href="/${to}">MASAKRA</a></body></html>`;
}

// ---------- build ----------
rmrf(OUT);
const projects = loadProjects();
copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));
projects.forEach((p) => {
  copyDir(path.join(SRC, 'projects', p.slug), path.join(OUT, 'work', p.slug), (f) => /\.(webp|jpe?g|png|gif|avif|svg|mp4)$/i.test(f));
});
const missing = [];
for (const [lang, prefix] of Object.entries(LANGS)) {
  setLang(lang);
  const list = projects.map(loc);
  write(`${prefix}index.html`, homePage(list));
  list.forEach((p, i) => write(`${prefix}work/${p.slug}.html`, projectPage(p, list[(i + 1) % list.length])));
  if (lang !== 'en') projects.filter((p) => !p.i18n[lang]).forEach((p) => missing.push(`${lang}: ${p.slug}`));
}
setLang('en');
write('404.html', notFound());

// Old WordPress URLs → new pages, so existing links keep working. Never overwrite a real page.
const legacy = JSON.parse(fs.readFileSync(path.join(SRC, 'redirects.json'), 'utf8'));
for (const [from, to] of Object.entries(legacy)) {
  const file = path.join(from, 'index.html');
  if (fs.existsSync(path.join(OUT, file))) continue;
  const target = to.endsWith('.html') && !fs.existsSync(path.join(OUT, to)) ? '' : to;
  write(file, redirect(target));
}

const urls = Object.values(LANGS).flatMap((pre) => ['', ...projects.map((p) => `work/${p.slug}.html`)].map((u) => pre + u));
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${site.url}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
write('.nojekyll', '');
if (fs.existsSync(path.join(SRC, 'CNAME'))) fs.copyFileSync(path.join(SRC, 'CNAME'), path.join(OUT, 'CNAME'));

console.log(`Built ${projects.length} projects × ${Object.keys(LANGS).length} languages${PROD ? ' (production: drafts left out)' : ' (preview: drafts included)'} → dist/`);
if (missing.length) console.log(`No translation yet (English text shown): ${missing.join(', ')}`);
