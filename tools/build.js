#!/usr/bin/env node
// MASAKRA site generator.
// Usage: node tools/build.js [--prod]
//   --prod  leaves out projects marked `draft: true` (use for the live site)
// Output goes to ./dist. Every link is relative, so the folder works on any host.

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const PROD = process.argv.includes('--prod');

const site = JSON.parse(fs.readFileSync(path.join(SRC, 'site.json'), 'utf8'));
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
    list.push({ slug, ...data, body: content });
  }
  list.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  list.forEach((p, i) => { p.num = pad2(i + 1); });
  return list;
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

// ---------- layout ----------
function head({ title, description, root, canonical }) {
  return `<!doctype html>
<html lang="en" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
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
<a class="skip" href="#main">Skip to content</a>`;
}
function header(root, home) {
  const h = home ? '' : `${root}index.html`;
  return `<header class="wrap site-header">
<a class="logo" href="${root}index.html" aria-label="MASAKRA — home">${logoBlack}</a>
<nav class="nav" aria-label="Primary">
<a class="mark hide-m" href="${h}#work">Work</a>
<a class="mark hide-m" href="${h}#agencies">For agencies</a>
<a class="mark hide-m" href="${h}#approach">Approach</a>
<a class="btn sm" href="${h}#contact">Start a project <span class="arrow" aria-hidden="true">→</span></a>
</nav>
</header>`;
}
function contactAndFooter(root) {
  return `<section id="contact" class="dark contact">
<div class="wrap section">
<span class="mono muted">Contact</span>
<h2 class="hero-h reveal">Have a brand that should <span class="soft">stand for something?</span></h2>
<a class="mail link-dark" href="mailto:${esc(site.email)}">${esc(site.email)} <svg class="arrow" aria-hidden="true" width="40" height="40" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M5 13L13 5M6 5h7v7"/></svg></a>
<p class="contact-note">Send a few lines about the brand, the timeline and the budget. You'll hear back within one business day.</p>
</div>
<footer class="wrap site-footer">
<span class="mono muted">© ${new Date().getFullYear()} ${esc(site.name)} — ${esc(site.owner)} · ${esc(site.location)}</span>
<nav aria-label="Social">
<a class="link-dark plain mono" href="${esc(site.instagram)}">Instagram</a>
<a class="link-dark plain mono" href="${esc(site.facebook)}">Facebook</a>
<a class="link-dark plain mono" href="#top">Back to top ↑</a>
</nav>
</footer>
</section>
</body>
</html>`;
}

// ---------- pages ----------
function homePage(projects) {
  const root = '';
  const featured = projects.filter((p) => p.featured).slice(0, 4);
  const rest = projects.filter((p) => !featured.includes(p));
  const pattern = [{ span: 's7', off: false }, { span: 's5', off: true }, { span: 's5', off: false }, { span: 's7', off: true }];
  const cards = featured.map((p, i) => {
    const pt = pattern[i % 4];
    const ratio = pt.span === 's7' ? '4-3' : '4-5';
    const cover = p.cover && p.cover.src ? { ...p.cover, src: `work/${p.slug}/${p.cover.src}` } : null;
    return `<a class="work-card ${pt.span}${pt.off ? ' offset' : ''} reveal" href="work/${p.slug}.html">
${media(cover ? { ...cover, ratio: cover.ratio || ratio } : null, root, `Image · ${p.cover?.alt || p.title}`, ratio)}
<div class="card-meta"><div class="card-title"><span class="mono muted">${p.num}</span><span class="t">${txt(p.title)}</span></div>
<div class="card-tag"><span class="mono muted">${txt(p.tag || p.category)}</span>${arrowNE}</div></div>
</a>`;
  }).join('\n');
  const rows = rest.map((p) => `<a class="idx-row" href="work/${p.slug}.html"><span class="l"><span class="mono muted">${p.num}</span><span class="t">${txt(p.title)}</span></span><span class="r"><span class="mono muted">${txt(p.tag || p.category)}</span><span aria-hidden="true">→</span></span></a>`).join('\n');
  const clients = site.clients.map((c) => `<span>${esc(c)}</span><b></b>`).join('');
  const set = (hidden) => `<div class="marquee-set"${hidden ? ' aria-hidden="true"' : ''}><span class="mono muted">Selected clients</span>${clients}</div>`;

  return `${head({ title: 'MASAKRA — Brand design & strategy', description: site.description, root, canonical: site.url + '/' })}
${header(root, true)}
<main id="main">
<section id="top" class="wrap hero">
<div class="hero-top rise d1 stack-m">
<span class="mono muted">Independent brand design &amp; strategy</span>
<span class="mono muted status"><i class="pulse"></i>${esc(site.status)}</span>
</div>
<h1 class="hero-h">
<span class="rise d2" style="display:block">Fewer elements.</span>
<span class="rise d3 soft" style="display:block">More weight<span class="sq pop" aria-hidden="true"></span></span>
</h1>
<div class="grid12 hero-foot rise d4">
<p class="s6">I'm Miroslav Švec — a one-person brand studio. I build identity systems, packaging and merch for brands that want to stand for something, and for agencies that need a senior partner without the overhead.</p>
<div class="s6 hero-cta">
<a class="btn" href="#work">See selected work <span class="arrow" aria-hidden="true">→</span></a>
<a class="mark" href="#agencies">Working with agencies</a>
</div>
</div>
</section>

<section class="marquee rise d5" aria-label="Selected clients"><div class="marquee-track">${set(false)}${set(true)}</div></section>

<section class="wrap section">
<div class="grid12">
<span class="mono muted s3 label-col">(01) Position</span>
<p class="big-h s9 reveal">I don't make pretty pictures. I build brands that hold together <span class="soft">— strategy, system, and every touchpoint after the logo.</span></p>
</div>
</section>

<section id="work" class="wrap" style="padding-bottom:72px">
<div class="sec-head stack-m"><span class="mono">(02) Selected work</span><span class="mono muted">Identity · Packaging · Merch</span></div>
<div class="grid12 work-grid">
${cards}
</div>
${rows ? `<div class="idx">\n${rows}\n</div>` : ''}
</section>

<section id="agencies" class="dark agencies">
<div class="wrap section">
<div class="grid12" style="margin-bottom:96px">
<span class="mono muted s3 label-col">(03) For agencies</span>
<div class="s9">
<h2 class="big-h reveal">Your senior brand designer in Europe<span class="sq" aria-hidden="true"></span></h2>
<p class="lead">For studios and agencies in the US that need identity and packaging work done at a senior level — without hiring for it.</p>
</div>
</div>
<div class="grid12 pillars">
<div class="s4 pillar reveal"><span class="mono n">01</span><h3 class="mid-h">Direct line.</h3><p>No account managers, no handoffs. You brief the person who designs.</p></div>
<div class="s4 pillar reveal"><span class="mono n">02</span><h3 class="mid-h">Your night, my day.</h3><p>Six to nine hours ahead of US time. Send feedback in the evening, wake up to revisions.</p></div>
<div class="s4 pillar reveal"><span class="mono n">03</span><h3 class="mid-h">Built for production.</h3><p>10+ years of packaging and event work under global beauty brand guidelines. Files that print right the first time.</p></div>
</div>
<div class="clocks">
<div class="clocks-set">
<div class="clock" data-tz="Europe/Bratislava"><span class="mono muted">Prešov, SK</span><span class="time"><span class="h">--</span><span class="colon">:</span><span class="m">--</span></span></div>
<div class="clock" data-tz="America/New_York"><span class="mono muted">New York</span><span class="time"><span class="h">--</span><span class="colon">:</span><span class="m">--</span></span></div>
<div class="clock" data-tz="America/Los_Angeles"><span class="mono muted">Los Angeles</span><span class="time"><span class="h">--</span><span class="colon">:</span><span class="m">--</span></span></div>
</div>
<a class="link-dark" href="#contact">Book an intro call →</a>
</div>
</div>
</section>

<section id="approach" class="wrap section" style="padding-bottom:120px">
<div class="grid12" style="margin-bottom:80px">
<span class="mono muted s3 label-col">(04) Approach</span>
<h2 class="big-h s9 reveal">Strategy first. Then the system. <span class="soft">Then the logo.</span></h2>
</div>
<div class="steps">
<div class="grid12 step"><span class="mono muted s3">Step 01</span><h3 class="mid-h s4">Position</h3><p class="s5">What the brand stands for — and what it refuses to be. Market, audience, the one thing worth saying.</p></div>
<div class="grid12 step"><span class="mono muted s3">Step 02</span><h3 class="mid-h s4">System</h3><p class="s5">Logo, type, color, pattern and the rules between them. Every element has a place and a reason.</p></div>
<div class="grid12 step"><span class="mono muted s3">Step 03</span><h3 class="mid-h s4">Deploy</h3><p class="s5">Packaging, apparel, campaigns, digital. Down to the fabric, the print method and how it feels in the hand.</p></div>
</div>
</section>

<section class="wrap" style="padding-bottom:168px">
<div class="grid12" style="row-gap:48px">
<span class="mono muted s3" style="padding-top:8px">(05) Services</span>
<div class="s5 services"><span>Brand identity systems</span><span>Packaging &amp; PR boxes</span><span>Merch, apparel &amp; fightwear</span><span>Campaign visuals</span></div>
<div class="s4 price"><span class="mono muted">Engagements from</span><span class="v">${txt(site.startingPrice)}</span><span class="n">A few projects at a time. Fixed scope, fixed price.</span></div>
</div>
</section>

<section class="wrap" style="padding-bottom:168px">
<figure class="grid12 quote">
<span class="mono muted s3">(06) Word</span>
<div class="s9">
<blockquote class="mid-h">“${txt(site.quote.text)}”</blockquote>
<figcaption class="mono muted" style="margin-top:32px">${txt(site.quote.name)} — ${txt(site.quote.role)}</figcaption>
</div>
</figure>
</section>
</main>
${contactAndFooter(root)}`;
}

function projectPage(p, next) {
  const root = '../';
  const secs = sections(p.body);
  const meta = [
    ['Client', p.client], ['Year', p.year], ['Scope', (p.scope || []).join(', ')], ['Industry', p.industry]
  ].filter(([, v]) => v);
  const cover = p.cover && p.cover.src ? media({ ...p.cover, src: `${p.slug}/${p.cover.src}`, ratio: p.cover.ratio || '16-9' }, '', '', '16-9')
    : media(null, '', `Cover · ${p.cover?.alt || p.title}`, '16-9');
  const gallery = (p.gallery || []).map((g) => {
    const span = g.span === 6 ? 's6' : 's12';
    const img = g.src ? { ...g, src: `${p.slug}/${g.src}` } : g;
    return `<figure class="${span} reveal">${media(img, '', g.alt, g.ratio || (span === 's6' ? '4-5' : '16-9'))}${g.caption ? `<figcaption class="mono muted">${txt(g.caption)}</figcaption>` : ''}</figure>`;
  }).join('\n');
  const desc = (p.summary || site.description).replace(/\[[^\]]*\]/g, '').trim() || site.description;

  return `${head({ title: `${p.title} — MASAKRA`, description: desc, root, canonical: `${site.url}/work/${p.slug}.html` })}
${header(root, false)}
<main id="main">
<section class="wrap cs-hero" id="top">
<a class="mark mono cs-back rise d1" href="${root}index.html#work">← All work</a>
<div class="rise d1"><span class="mono muted">Case study ${p.num} · ${txt(p.category || '')}</span></div>
<h1 class="cs-title rise d2">${txt(p.title)}<span class="sq pop" aria-hidden="true"></span></h1>
${p.summary ? `<p class="cs-summary rise d3">${txt(p.summary)}</p>` : ''}
<div class="cs-meta grid12 rise d4">
${meta.map(([k, v]) => `<div class="item s3"><span class="mono muted">${k}</span><span class="sg" style="font-size:20px;font-weight:500;letter-spacing:-.01em;line-height:1.3">${txt(v)}</span></div>`).join('\n')}
</div>
</section>
<div class="wrap cs-cover rise d5">${cover}</div>
<section class="wrap cs-body">
${secs.map((s) => `<div class="grid12 cs-sec reveal"><h2 class="mono s3">${txt(s.title)}</h2><div class="content s9">${s.html}</div></div>`).join('\n')}
</section>
${gallery ? `<section class="wrap"><div class="grid12 gallery">\n${gallery}\n</div></section>` : ''}
<section class="wrap">
<a class="next" href="${next.slug}.html"><span class="mono muted">Next project</span><br><span class="t">${txt(next.title)} <span aria-hidden="true">→</span></span></a>
</section>
</main>
${contactAndFooter(root)}`;
}

function notFound() {
  // 404 lives at the site root on GitHub Pages; absolute paths so it works at any URL depth.
  const root = '/';
  return `${head({ title: 'Not found — MASAKRA', description: site.description, root, canonical: site.url + '/' })}
${header(root, false).replace(/href="\/index.html#/g, 'href="/#')}
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
write('index.html', homePage(projects));
projects.forEach((p, i) => {
  const next = projects[(i + 1) % projects.length];
  write(`work/${p.slug}.html`, projectPage(p, next));
  const imgDir = path.join(SRC, 'projects', p.slug);
  copyDir(imgDir, path.join(OUT, 'work', p.slug), (f) => /\.(webp|jpe?g|png|gif|avif|svg|mp4)$/i.test(f));
});
write('404.html', notFound());

// Old WordPress URLs → new pages, so existing links keep working.
const legacy = JSON.parse(fs.readFileSync(path.join(SRC, 'redirects.json'), 'utf8'));
for (const [from, to] of Object.entries(legacy)) {
  const target = to.startsWith('work/') && !projects.find((p) => `work/${p.slug}.html` === to) ? '' : to;
  write(path.join(from, 'index.html'), redirect(target));
}

const urls = ['', ...projects.map((p) => `work/${p.slug}.html`)];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `<url><loc>${site.url}/${u}</loc></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
write('.nojekyll', '');
if (fs.existsSync(path.join(SRC, 'CNAME'))) fs.copyFileSync(path.join(SRC, 'CNAME'), path.join(OUT, 'CNAME'));

console.log(`Built ${projects.length} projects${PROD ? ' (production: drafts left out)' : ' (preview: drafts included)'} → dist/`);
