#!/usr/bin/env node
// Static site builder for forgedbyartifact.com
//
// Reads  site.yml  and every  projects/<slug>/project.md  (+ the images beside it),
// writes the finished site to  _site/  ready for GitHub Pages.
//
//   npm run build            production build (clean URLs: /work/<slug>/)
//   npm run build -- --preview   links point at .../index.html so the output
//                                also works when opened from disk or a plain file host

import fs from 'node:fs/promises';
import fss from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';
import sharp from 'sharp';
import { renderHome, renderProject, renderRedirect, render404, renderLegacyProjectHtml } from './templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, '_site');
const CACHE = path.join(ROOT, '.cache', 'media');
const PROJECTS = path.join(ROOT, 'projects');
const PREVIEW = process.argv.includes('--preview');

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif|tiff?)$/i;
const VIDEO_EXT = /\.(mp4|webm)$/i;
const UNSUPPORTED_EXT = /\.(heic|heif|mov)$/i;
const YT_LINE = /^(https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.be)\/\S+)\s*(.*)$/i;
const MD_IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)$/;
const WIDTHS = [640, 1600];

const warnings = [];
const warn = (msg) => { warnings.push(msg); console.warn('  ! ' + msg); };

// ---------- helpers ----------
const ytId = (url) => (String(url).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/) || [])[1] || null;
const naturalSort = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
const safeName = (file) => file.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function toISODate(v) {
  if (!v) return '';
  if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
  const m = String(v).match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  return m ? `${m[1]}-${m[2]}-${m[3] || '01'}` : '';
}

function readSiteConfig() {
  const src = fss.readFileSync(path.join(ROOT, 'site.yml'), 'utf8');
  return matter(`---\n${src}\n---\n`).data;
}

// ---------- project parsing ----------
function parseBody(body, folderFiles, slug) {
  // Returns { overviewHtml, gallery: [media], entries: [{title, html, media}] }
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  const overview = { text: [], media: [] };
  const entries = [];
  let cur = overview;

  const mediaFromLine = (raw) => {
    const line = raw.trim();
    if (!line) return null;
    const yt = line.match(YT_LINE);
    if (yt) {
      const id = ytId(yt[1]);
      if (!id) { warn(`${slug}: couldn't read a YouTube video id from "${yt[1]}"`); return []; }
      return [{ type: 'youtube', id, title: yt[2].trim() }];
    }
    const md = line.match(MD_IMAGE);
    if (md) return [{ type: 'file', file: md[2], caption: md[1].trim() }];
    const tokens = line.split(/[\s,]+/).filter(Boolean);
    if (tokens.every((t) => IMAGE_EXT.test(t) || VIDEO_EXT.test(t) || UNSUPPORTED_EXT.test(t))) {
      return tokens.map((file) => ({ type: 'file', file, caption: '' }));
    }
    return null;
  };

  for (const raw of lines) {
    const h = raw.match(/^##\s+(.+?)\s*#*\s*$/);
    if (h) { cur = { title: h[1].trim(), text: [], media: [] }; entries.push(cur); continue; }
    const media = mediaFromLine(raw);
    if (media) { cur.media.push(...media); cur.text.push(''); continue; }
    cur.text.push(raw);
  }

  const used = new Set();
  const resolve = (list, ctxTitle) => list.flatMap((m) => {
    if (m.type === 'youtube') return [{ ...m, title: m.title || ctxTitle || 'Video' }];
    const file = folderFiles.find((f) => f === m.file) || folderFiles.find((f) => f.toLowerCase() === m.file.toLowerCase());
    if (!file) { warn(`${slug}: "${m.file}" is mentioned in project.md but isn't in the folder`); return []; }
    if (UNSUPPORTED_EXT.test(file)) { warn(`${slug}: "${file}" can't be shown in browsers — export it as .jpg (photos) or .mp4 (video)`); return []; }
    used.add(file);
    return [{ type: VIDEO_EXT.test(file) ? 'video' : 'image', file, caption: m.caption || '', title: m.caption || ctxTitle || '' }];
  });

  const md = (arr) => marked.parse(arr.join('\n').trim());
  return {
    overviewHtml: md(overview.text),
    gallery: resolve(overview.media, ''),
    entries: entries.map((e) => ({ title: e.title, html: md(e.text), media: resolve(e.media, e.title) })),
    used,
  };
}

async function loadProjects() {
  const dirs = (await fs.readdir(PROJECTS, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !/^[_.]/.test(d.name))
    .map((d) => d.name)
    .sort(naturalSort);

  const projects = [];
  for (const slug of dirs) {
    const dir = path.join(PROJECTS, slug);
    const mdPath = path.join(dir, 'project.md');
    if (!fss.existsSync(mdPath)) { warn(`projects/${slug}/ has no project.md — skipped`); continue; }
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) warn(`projects/${slug}/: folder names work best as lowercase-with-dashes (it becomes the page address)`);

    const { data: fm, content } = matter(await fs.readFile(mdPath, 'utf8'));
    const hidden = new Set([].concat(fm.hidden || []).map(String));
    const folderFiles = (await fs.readdir(dir))
      .filter((f) => !f.startsWith('_') && !f.startsWith('.') && !hidden.has(f))
      .filter((f) => IMAGE_EXT.test(f) || VIDEO_EXT.test(f) || UNSUPPORTED_EXT.test(f))
      .sort(naturalSort);

    const body = parseBody(content, folderFiles, slug);

    // cover: front matter → cover.* → first image used on the page → first image in folder
    const images = folderFiles.filter((f) => IMAGE_EXT.test(f));
    let cover = fm.cover && images.find((f) => f === fm.cover);
    if (fm.cover && !cover) warn(`${slug}: cover "${fm.cover}" isn't in the folder`);
    cover ||= images.find((f) => /^cover\./i.test(f));
    cover ||= body.entries.flatMap((e) => e.media).concat(body.gallery).find((m) => m.type === 'image')?.file;
    cover ||= images[0];
    if (!cover) warn(`${slug}: no images found — the card will be blank`);

    // anything in the folder that project.md never mentions goes to "More photos"
    for (const f of folderFiles) {
      if (body.used.has(f) || f === cover || UNSUPPORTED_EXT.test(f)) {
        if (UNSUPPORTED_EXT.test(f) && !body.used.has(f)) warn(`${slug}: "${f}" can't be shown in browsers — export it as .jpg (photos) or .mp4 (video)`);
        continue;
      }
      body.gallery.push({ type: VIDEO_EXT.test(f) ? 'video' : 'image', file: f, caption: '', title: '' });
    }

    // short plain-text excerpt of the first overview paragraph (used on the featured card)
    const firstPara = (body.overviewHtml.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || '';
    let excerpt = firstPara.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
    if (excerpt.length > 240) excerpt = excerpt.slice(0, 240).replace(/\s+\S*$/, '') + '…';

    const status = String(fm.status || 'done').toLowerCase().replace(/\s+/g, '-');
    projects.push({
      slug,
      title: fm.title ? String(fm.title) : slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      no: Number.isFinite(Number(fm.no)) && fm.no !== null && fm.no !== '' ? Number(fm.no) : null,
      date: toISODate(fm.date),
      status: ['in-progress', 'wip', 'on-the-bench'].includes(status) ? 'in-progress' : 'done',
      featured: fm.featured === true,
      tags: [].concat(fm.tags || []).map((t) => String(t).trim()).filter(Boolean),
      blurb: fm.blurb ? String(fm.blurb) : '',
      client: fm.client ? String(fm.client) : '',
      location: fm.location ? String(fm.location) : '',
      excerpt,
      cover,
      dir,
      ...body,
    });
  }

  // numbering: explicit `no:` wins; the rest count up from the highest, oldest first
  let next = Math.max(0, ...projects.map((p) => p.no || 0)) + 1;
  [...projects]
    .filter((p) => p.no == null)
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || naturalSort(a.slug, b.slug))
    .forEach((p) => { p.no = next++; });
  const dupes = projects.filter((p, i) => projects.findIndex((q) => q.no === p.no) !== i);
  dupes.forEach((p) => warn(`${p.slug}: number ${p.no} is used by more than one project`));

  // display order: newest first
  projects.sort((a, b) => (b.date || '').localeCompare(a.date || '') || b.no - a.no);
  return projects;
}

// ---------- images ----------
async function processImage(srcPath, slug, file) {
  const buf = await fs.readFile(srcPath);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 16);
  const metaPath = path.join(CACHE, `${hash}.json`);
  let meta;
  if (fss.existsSync(metaPath)) {
    meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
    if (!meta.variants.every((v) => fss.existsSync(path.join(CACHE, v.cacheFile)))) meta = null;
  }
  if (!meta) {
    const img = sharp(buf, { failOn: 'none' }).rotate();
    const info = await img.metadata();
    const portrait = (info.orientation || 1) >= 5;
    const fullW = portrait ? info.height : info.width;
    const variants = [];
    for (const w of WIDTHS) {
      const target = Math.min(w, fullW);
      if (variants.some((v) => v.width === target)) continue;
      const cacheFile = `${hash}-${target}.webp`;
      const out = await sharp(buf, { failOn: 'none' }).rotate().resize({ width: target, withoutEnlargement: true })
        .webp({ quality: target > 1000 ? 80 : 74 }).toFile(path.join(CACHE, cacheFile));
      variants.push({ width: out.width, height: out.height, cacheFile });
    }
    meta = { variants };
    await fs.writeFile(metaPath, JSON.stringify(meta));
  }
  const base = `media/${slug}/${safeName(file)}`;
  const variants = [];
  for (const v of meta.variants) {
    const rel = `${base}-${v.width}.webp`;
    await fs.copyFile(path.join(CACHE, v.cacheFile), path.join(OUT, rel));
    variants.push({ width: v.width, height: v.height, src: rel });
  }
  return variants; // ascending width
}

async function processMedia(projects, site) {
  const jobs = [];
  for (const p of projects) {
    await fs.mkdir(path.join(OUT, 'media', p.slug), { recursive: true });
    const heroPhoto = p.slug === site.hero && site.hero_photo ? String(site.hero_photo) : null;
    if (heroPhoto && !fss.existsSync(path.join(p.dir, heroPhoto))) warn(`site.yml: hero_photo "${heroPhoto}" isn't in projects/${p.slug}/`);
    const files = new Set([p.cover, heroPhoto && fss.existsSync(path.join(p.dir, heroPhoto)) ? heroPhoto : null, ...p.gallery, ...p.entries.flatMap((e) => e.media)].map((m) => (typeof m === 'string' ? m : m?.file)).filter(Boolean));
    p.media = {};
    for (const file of files) {
      const src = path.join(p.dir, file);
      if (VIDEO_EXT.test(file)) {
        const rel = `media/${p.slug}/${safeName(file.replace(VIDEO_EXT, ''))}${path.extname(file).toLowerCase()}`;
        jobs.push(async () => { await fs.copyFile(src, path.join(OUT, rel)); p.media[file] = { video: rel }; });
      } else {
        jobs.push(async () => {
          try { p.media[file] = { variants: await processImage(src, p.slug, file) }; }
          catch (err) { warn(`${p.slug}: couldn't process "${file}" (${err.message})`); }
        });
      }
    }
  }
  // small worker pool — sharp is already multi-threaded internally
  let i = 0, done = 0;
  const total = jobs.length;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < jobs.length) {
      const job = jobs[i++];
      await job();
      done++;
      if (process.stdout.isTTY) process.stdout.write(`\r  media ${done}/${total}`);
    }
  }));
  if (process.stdout.isTTY) process.stdout.write('\n');
}

// ---------- write ----------
async function write(rel, html) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  for (const e of await fs.readdir(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(s, d); else await fs.copyFile(s, d);
  }
}

async function main() {
  const t0 = Date.now();
  const site = readSiteConfig();
  site.url = String(site.url || '').replace(/\/$/, '');
  site.preview = PREVIEW;
  site.year = new Date().getFullYear();

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });
  await fs.mkdir(CACHE, { recursive: true });

  console.log('Reading projects…');
  const projects = await loadProjects();
  console.log(`  ${projects.length} projects: ${projects.map((p) => p.slug).join(', ')}`);

  console.log('Processing photos…');
  await processMedia(projects, site);

  console.log('Writing pages…');
  await write('index.html', renderHome(site, projects));
  const byNo = [...projects].sort((a, b) => a.no - b.no);
  for (const p of projects) {
    const i = byNo.indexOf(p);
    await write(`work/${p.slug}/index.html`, renderProject(site, p, { prev: byNo[i - 1], next: byNo[i + 1] }));
    // old addresses keep working: /projects/<slug>/ and /project.html?slug=<slug>
    await write(`projects/${p.slug}/index.html`, renderRedirect(site, `work/${p.slug}/`, 2));
  }
  await write('project.html', renderLegacyProjectHtml(site));
  await write('404.html', render404(site));

  if (site.url && !PREVIEW) {
    const urls = ['/', ...projects.map((p) => `/work/${p.slug}/`)];
    await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${site.url}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
    await write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);
  }

  await copyDir(path.join(ROOT, 'assets'), path.join(OUT, 'assets'));
  if (fss.existsSync(path.join(ROOT, 'CNAME')) && !PREVIEW) await fs.copyFile(path.join(ROOT, 'CNAME'), path.join(OUT, 'CNAME'));

  console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s → _site/`);
  if (warnings.length) console.log(`\n${warnings.length} warning(s) — the site still built:\n${warnings.map((w) => '  • ' + w).join('\n')}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
