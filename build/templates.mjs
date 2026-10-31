// HTML templates for the "Shop Tag" design. Plain template strings — no framework.

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(3, '0');
const monthYear = (iso) => (iso ? `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}` : '');
const tagLabel = (t) => String(t).replace(/-/g, ' ');
const tagKey = (t) => String(t).toLowerCase().replace(/\s+/g, '-');

// ---------- paths ----------
const base = (depth) => (depth ? '../'.repeat(depth) : './');
const homeHref = (site, depth) => base(depth) + (site.preview ? 'index.html' : '');
const workHref = (site, depth, slug) => `${base(depth)}work/${slug}/${site.preview ? 'index.html' : ''}`;

function largest(p, file) { const v = p.media?.[file]?.variants; return v ? v[v.length - 1] : null; }

function img(p, file, depth, { alt = '', sizes = '100vw', cls = '', eager = false } = {}) {
  const v = p.media?.[file]?.variants;
  if (!v) return '';
  const big = v[v.length - 1];
  const srcset = v.map((x) => `${base(depth)}${x.src} ${x.width}w`).join(', ');
  return `<img src="${base(depth)}${big.src}" srcset="${srcset}" sizes="${sizes}" width="${big.width}" height="${big.height}" alt="${esc(alt)}"${cls ? ` class="${cls}"` : ''} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

const ICON = {
  arrowR: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  arrowL: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  play: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
};

// ---------- shared chrome ----------
function head(site, depth, { title, description, image, path: pagePath }) {
  const canonical = site.url ? `${site.url}/${pagePath || ''}` : '';
  const ogImage = image && site.url ? `${site.url}/${image}` : '';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical && !site.preview ? `<link rel="canonical" href="${esc(canonical)}">` : ''}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${esc(canonical)}">` : ''}
${ogImage ? `<meta property="og:image" content="${esc(ogImage)}">\n<meta name="twitter:card" content="summary_large_image">` : ''}
${site.google_site_verification ? `<meta name="google-site-verification" content="${esc(site.google_site_verification)}">` : ''}
<meta name="theme-color" content="#ECE9E2">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='8' fill='%23171614'/%3E%3Ctext x='32' y='50' font-family='Arial Narrow,Arial,sans-serif' font-weight='900' font-size='46' text-anchor='middle' fill='%23ECE9E2'%3EA%3C/text%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Big+Shoulders+Display:wght@800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${base(depth)}assets/site.css">
<script src="${base(depth)}assets/site.js" defer></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>`;
}

function header(site, depth, { full = true } = {}) {
  const home = homeHref(site, depth);
  return `<header class="site-header">
  <div class="wrap bar">
    <a class="brand" href="${home}" aria-label="${esc(site.name)} home">
      <span class="brand-mark" aria-hidden="true">A</span>
      <span class="brand-text">
        <span class="brand-name">${esc(site.name)}</span>
        ${full ? `<span class="brand-sub">${esc(site.tagline)}</span>` : ''}
      </span>
    </a>
    <nav class="nav" aria-label="Main">
      <a href="${home}#work">Work</a>
      <a class="btn-dark" href="${home}#contact">Start a work order</a>
    </nav>
  </div>
</header>`;
}

function footer(site) {
  return `<footer class="site-footer">
  <div class="wrap bar">
    <span>© ${site.year} ${esc(site.name)} · ${esc((site.url || '').replace(/^https?:\/\//, ''))}</span>
    <a href="mailto:${esc(site.email)}">${esc(site.email)}</a>
  </div>
</footer>
${lightbox()}
</body>
</html>`;
}

function lightbox() {
  return `<dialog class="lb" id="lb" aria-label="Photo viewer">
  <div class="lb-stage"></div>
  <p class="lb-caption"></p>
  <button class="lb-btn lb-close" type="button" aria-label="Close">${ICON.close}</button>
  <button class="lb-btn lb-prev" type="button" aria-label="Previous">${ICON.arrowL}</button>
  <button class="lb-btn lb-next" type="button" aria-label="Next">${ICON.arrowR}</button>
</dialog>`;
}

const kicker = (p) => [`No. ${pad(p.no)}`, monthYear(p.date), p.client || p.location || (p.tags[0] && tagLabel(p.tags[0]))].filter(Boolean).join(' · ');

// ---------- home ----------
export function renderHome(site, projects) {
  const depth = 0;
  const heroP = projects.find((p) => p.slug === site.hero) || projects.find((p) => p.status === 'done' && p.cover) || projects[0];
  const featured = projects.find((p) => p.featured) || projects.find((p) => p.status === 'in-progress') || projects[0];
  const rest = projects.filter((p) => p !== featured);

  // filter chips: tags shared by 2+ projects (fallback: most common), plus "on the bench"
  const counts = new Map();
  projects.forEach((p) => new Set(p.tags.map(tagKey)).forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  let chips = [...counts].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  if (chips.length < 2) chips = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);
  chips = chips.slice(0, 6);
  const anyWip = projects.some((p) => p.status === 'in-progress');
  const dataAttrs = (p) => `data-tags="${esc(p.tags.map(tagKey).join(' '))}" data-status="${p.status}"`;

  // site.yml `hero_photo` picks a specific photo from the hero project's folder; default is its cover
  const heroFile = heroP && (site.hero_photo && heroP.media?.[site.hero_photo] ? site.hero_photo : heroP.cover);
  const heroCover = heroP && largest(heroP, heroFile);
  const featuredHtml = featured ? `
    <a class="card card-feature" href="${workHref(site, depth, featured.slug)}" ${dataAttrs(featured)}>
      <div class="card-feature-media">${img(featured, featured.cover, depth, { alt: '', sizes: '(min-width: 1000px) 60vw, 100vw' })}</div>
      <div class="card-feature-body">
        <div class="card-feature-top">
          <span class="tagno"><span class="hole" aria-hidden="true"></span>No. ${pad(featured.no)}${featured.date ? ' · ' + monthYear(featured.date) : ''}</span>
          ${featured.status === 'in-progress' ? '<span class="pill-accent">On the bench</span>' : ''}
        </div>
        <h3 class="card-feature-title">${esc(featured.title)}</h3>
        ${featured.blurb ? `<p class="card-feature-blurb">${esc(featured.blurb)}</p>` : ''}
        ${featured.excerpt ? `<p class="card-feature-excerpt">${esc(featured.excerpt)}</p>` : ''}
        <div class="chips-small">${featured.tags.map((t) => `<span>${esc(tagLabel(t))}</span>`).join('')}</div>
      </div>
    </a>` : '';

  const card = (p) => `
      <a class="card" href="${workHref(site, depth, p.slug)}" ${dataAttrs(p)}>
        <div class="card-media">${img(p, p.cover, depth, { alt: '', sizes: '(min-width: 1200px) 400px, (min-width: 640px) 50vw, 100vw' })}
          ${p.status === 'in-progress' ? '<span class="pill-accent card-flag">On the bench</span>' : ''}</div>
        <div class="card-body">
          <span class="kicker">${esc(kicker(p))}</span>
          <h3 class="card-title">${esc(p.title)}</h3>
          ${p.blurb ? `<p>${esc(p.blurb)}</p>` : ''}
        </div>
      </a>`;

  return `${head(site, depth, { title: `${site.name} — Handcrafted props for film, stage & events`, description: site.description, image: heroCover?.src, path: '' })}
${header(site, depth)}
<main id="main">
  <section class="wrap hero">
    <div class="hero-copy">
      <div class="hero-text">
        ${site.eyebrow ? `<span class="eyebrow">${esc(site.eyebrow)}</span>` : ''}
        <h1 class="hero-title">${esc(site.headline)}</h1>
        ${site.intro ? `<p class="hero-intro">${esc(site.intro)}</p>` : ''}
      </div>
      <div class="actions">
        <a class="btn btn-accent" href="#contact">Start a work order ${ICON.arrowR}</a>
        <a class="btn btn-line" href="#work">See the builds</a>
      </div>
    </div>
    ${heroP ? `<a class="hero-figure" href="${workHref(site, depth, heroP.slug)}">
      ${img(heroP, heroFile, depth, { alt: heroFile === heroP.cover ? heroP.title : `Building the ${heroP.title}`, sizes: '(min-width: 1000px) 50vw, 100vw', eager: true })}
      <span class="tag">
        <span class="hole" aria-hidden="true"></span>
        <span class="tag-text"><span class="tag-kicker">${esc([`No. ${pad(heroP.no)}`, heroP.location].filter(Boolean).join(' · '))}</span><span class="tag-title">${esc(heroP.title)}</span></span>
      </span>
    </a>` : ''}
  </section>

  ${site.skills?.length ? `<div class="skills"><ul class="wrap">${site.skills.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : ''}

  <section class="wrap work" id="work">
    <div class="section-head">
      <div>
        <span class="eyebrow">${String(projects.length).padStart(2, '0')} builds · newest first</span>
        <h2 class="section-title">The shop floor</h2>
      </div>
      <div class="filters" role="group" aria-label="Filter builds">
        <button type="button" class="chip" aria-pressed="true" data-filter="*">All</button>
        ${chips.map((t) => `<button type="button" class="chip" aria-pressed="false" data-filter="tag:${esc(t)}">${esc(tagLabel(t))}</button>`).join('')}
        ${anyWip ? '<button type="button" class="chip" aria-pressed="false" data-filter="status:in-progress">On the bench</button>' : ''}
      </div>
    </div>
    ${featuredHtml}
    <div class="grid">${rest.map(card).join('')}
    </div>
    <p class="empty" hidden>Nothing here yet — try another filter.</p>
  </section>

  <section class="wrap contact" id="contact">
    <div class="workorder">
      <div class="workorder-main">
        <span class="eyebrow eyebrow-ink">Work order</span>
        <h2 class="section-title">${esc(site.contact?.heading || 'Start a project')}</h2>
        ${site.contact?.text ? `<p>${esc(site.contact.text)}</p>` : ''}
        <a class="btn btn-dark" href="mailto:${esc(site.email)}">${esc(site.email)}</a>
      </div>
      ${site.contact?.facts?.length ? `<dl class="workorder-facts">${site.contact.facts.map((f) => `<div><dt>${esc(f.label)}</dt><dd>${esc(f.value)}</dd></div>`).join('')}</dl>` : ''}
    </div>
  </section>
</main>
${footer(site)}`;
}

// ---------- project ----------
function mediaTile(p, m, depth, { sizes = '(min-width: 1000px) 300px, 50vw' } = {}) {
  const title = m.caption || m.title || p.title;
  if (m.type === 'youtube') {
    return `<a class="tile tile-video" href="https://www.youtube.com/watch?v=${m.id}" data-lb="youtube" data-yt="${m.id}" data-title="${esc(title)}">
          <img src="https://i.ytimg.com/vi/${m.id}/hqdefault.jpg" alt="" loading="lazy" decoding="async" width="480" height="360" onerror="this.style.visibility='hidden'">
          <span class="play" aria-hidden="true">${ICON.play}</span>
          <span class="tile-label">Video · ${esc(title)}</span>
        </a>`;
  }
  if (m.type === 'video') {
    const v = p.media?.[m.file]?.video;
    return v ? `<figure class="tile tile-file-video"><video src="${base(depth)}${v}" controls preload="metadata" playsinline></video>${m.caption ? `<figcaption class="tile-label">${esc(m.caption)}</figcaption>` : ''}</figure>` : '';
  }
  const big = largest(p, m.file);
  if (!big) return '';
  return `<a class="tile" href="${base(depth)}${big.src}" data-lb="image" data-title="${esc(title)}">${img(p, m.file, depth, { alt: m.caption || '', sizes })}${m.caption ? `<span class="tile-label">${esc(m.caption)}</span>` : ''}</a>`;
}

export function renderProject(site, p, { prev, next }) {
  const depth = 2;
  const all = [...p.entries.flatMap((e) => e.media), ...p.gallery];
  const counts = {
    image: new Set([p.cover, ...all.filter((m) => m.type === 'image').map((m) => m.file)].filter(Boolean)).size,
    video: new Set(all.filter((m) => m.type !== 'image').map((m) => m.id || m.file)).size,
  };
  const mediaCount = [counts.image && `${counts.image} photo${counts.image === 1 ? '' : 's'}`, counts.video && `${counts.video} video${counts.video === 1 ? '' : 's'}`].filter(Boolean).join(' · ');
  const spec = [
    ['Date', monthYear(p.date)],
    ['Location', p.location],
    ['For', p.client],
    ['Media', mediaCount],
  ].filter(([, v]) => v);
  const cover = largest(p, p.cover);

  return `${head(site, depth, { title: `${p.title} — ${site.name}`, description: p.blurb || site.description, image: cover?.src, path: `work/${p.slug}/` })}
${header(site, depth, { full: false })}
<main id="main">
  <section class="wrap project-head">
    <a class="crumb" href="${homeHref(site, depth)}#work">${ICON.arrowL} Shop floor / No. ${pad(p.no)}</a>
    <div class="project-head-row">
      <div class="project-head-main">
        ${p.status === 'in-progress' ? '<span class="pill-accent">On the bench</span>' : ''}
        <h1 class="project-title">${esc(p.title)}</h1>
        ${p.blurb ? `<p class="project-blurb">${esc(p.blurb)}</p>` : ''}
      </div>
      ${spec.length ? `<dl class="spec">${spec.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
    </div>
    ${p.tags.length ? `<ul class="chips-accent">${p.tags.map((t) => `<li>${esc(tagLabel(t))}</li>`).join('')}</ul>` : ''}
  </section>

  ${cover ? `<section class="wrap project-cover"><a href="${base(depth)}${cover.src}" data-lb="image" data-title="${esc(p.title)}">${img(p, p.cover, depth, { alt: p.title, sizes: '(min-width: 1240px) 1200px, 100vw', eager: true })}</a></section>` : ''}

  ${p.overviewHtml.trim() ? `<section class="wrap brief">
    <h2 class="brief-title">The brief</h2>
    <div class="prose prose-lg">${p.overviewHtml}</div>
  </section>` : ''}

  ${p.entries.length ? `<section class="wrap log">
    <div class="log-head">
      <h2 class="section-title">Build log</h2>
      <span class="eyebrow">${p.entries.length} entr${p.entries.length === 1 ? 'y' : 'ies'}</span>
    </div>
    ${p.entries.map((e, i) => `<article class="entry">
      <div class="entry-label">
        <span class="entry-no">${String(i + 1).padStart(2, '0')}</span>
        <h3 class="entry-title">${esc(e.title)}</h3>
      </div>
      <div class="entry-body">
        ${e.html.trim() ? `<div class="prose">${e.html}</div>` : ''}
        ${e.media.length ? `<div class="tiles${e.media.length === 1 ? ' tiles-one' : ''}">${e.media.map((m) => mediaTile(p, m, depth, { sizes: e.media.length === 1 ? '(min-width: 1000px) 620px, 100vw' : '(min-width: 1000px) 300px, 50vw' })).join('')}</div>` : ''}
      </div>
    </article>`).join('\n    ')}
  </section>` : ''}

  ${p.gallery.length ? `<section class="wrap more">
    <div class="log-head"><h2 class="section-title">${p.entries.length ? 'More photos' : 'Photos'}</h2></div>
    <div class="tiles tiles-gallery">${p.gallery.map((m) => mediaTile(p, m, depth)).join('')}</div>
  </section>` : ''}

  <nav class="wrap pager" aria-label="More builds">
    ${prev ? `<a class="pager-link" href="${workHref(site, depth, prev.slug)}"><span class="kicker">← No. ${pad(prev.no)}</span><span class="pager-title">${esc(prev.title)}</span></a>` : '<span></span>'}
    ${next ? `<a class="pager-link pager-next" href="${workHref(site, depth, next.slug)}"><span class="kicker">No. ${pad(next.no)} →</span><span class="pager-title">${esc(next.title)}</span></a>` : `<a class="pager-link pager-next" href="${homeHref(site, depth)}#contact"><span class="kicker">Next →</span><span class="pager-title">Start a work order</span></a>`}
  </nav>
</main>
${footer(site)}`;
}

// ---------- redirects & 404 ----------
export function renderRedirect(site, target, depth) {
  const href = base(depth) + target + (site.preview ? 'index.html' : '');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title>
<meta http-equiv="refresh" content="0; url=${href}"><link rel="canonical" href="${site.url}/${target}">
</head><body><p>This page moved: <a href="${href}">continue</a>.</p></body></html>`;
}

export function renderLegacyProjectHtml(site) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(site.name)}</title>
<script>var s=new URLSearchParams(location.search).get('slug');location.replace(s&&/^[a-z0-9-]+$/i.test(s)?'work/'+s+'/${site.preview ? 'index.html' : ''}':'./');</script>
</head><body><p><a href="./">Continue to ${esc(site.name)}</a></p></body></html>`;
}

export function render404(site) {
  // 404 can be served at any depth, so it uses absolute paths
  const abs = (s) => '/' + s;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Not found — ${esc(site.name)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600&family=Big+Shoulders+Display:wght@800;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<link rel="stylesheet" href="${abs('assets/site.css')}"></head>
<body><main class="wrap notfound">
<span class="eyebrow">Error 404 · No such tag</span>
<h1 class="hero-title">This prop isn't on the shelf.</h1>
<p><a class="btn btn-dark" href="/">Back to the shop floor</a></p>
</main></body></html>`;
}
