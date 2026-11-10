// Runs after `vite build`. The app itself is one page that reads the URL, but
// search engines and link previews (LinkedIn, Telegram, WhatsApp) read the HTML
// before any JavaScript runs. So every address gets its own HTML file with the
// right language, title, description and links to the other languages:
//
//   /                 -> dist/index.html          /impressum     -> dist/impressum.html
//   /en               -> dist/en.html             /en/impressum  -> dist/en/impressum.html
//   /uk               -> dist/uk.html             ...
//
// Cloudflare Pages (and GitHub Pages) serve dist/en.html at /en, without ".html".
// Also written: 404.html, robots.txt and, once SITE_URL is known, sitemap.xml.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createServer } from 'vite';

const DIST = resolve('dist');

// load the app's own modules (with their extension-less imports) through Vite
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { LANGS, SITE_URL: SITE_FROM_CODE, IMPRINT } = await vite.ssrLoadModule('/src/data/site.js');
const { DEFAULT_LANG, PAGES, pathFor } = await vite.ssrLoadModule('/src/lib/lang.js');
const { pageMeta } = await vite.ssrLoadModule('/src/lib/meta.js');
await vite.close();

const SITE_URL = (process.env.SITE_URL || SITE_FROM_CODE || '').replace(/\/$/, '');
const locales = Object.fromEntries(LANGS.map((l) => [l, JSON.parse(readFileSync(`src/locales/${l}.json`, 'utf8'))]));
const OG_LOCALE = { de: 'de_DE', en: 'en_GB', uk: 'uk_UA' };

// a tiny t() for the build: 'meta.title' -> locales[lang].meta.title
const tFor = (lang) => (key) => key.split('.').reduce((o, k) => o?.[k], locales[lang]) ?? key;

const escape = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fileFor = (path) => (path === '/' ? 'index.html' : `${path.slice(1)}.html`);

const template = readFileSync(resolve(DIST, 'index.html'), 'utf8');

function render(lang, page, { noindex = false } = {}) {
  const { title, description } = pageMeta(tFor(lang), lang, page);
  const path = pathFor(lang, page);
  const head = [
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Andrii Naumov" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (noindex) head.push('<meta name="robots" content="noindex" />');
  // these need a full address, so they appear once SITE_URL is set
  if (SITE_URL && !noindex) {
    head.push(
      `<link rel="canonical" href="${SITE_URL}${path}" />`,
      `<meta property="og:url" content="${SITE_URL}${path}" />`,
      `<meta property="og:image" content="${SITE_URL}/og-image.png" />`,
      `<meta property="og:image:width" content="1200" />`,
      `<meta property="og:image:height" content="630" />`,
      ...[...LANGS, 'x-default'].map(
        (l) =>
          `<link rel="alternate" hreflang="${l}" href="${SITE_URL}${pathFor(l === 'x-default' ? DEFAULT_LANG : l, page)}" data-hreflang="" />`,
      ),
    );
  }

  return template
    .replace(/<html lang="[^"]*">/, `<html lang="${lang}">`)
    .replace(/\n\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\n\s*<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(/\n\s*<\/head>/, `\n    ${head.join('\n    ')}\n  </head>`)
    .replace(
      '<div id="root"></div>',
      `<div id="root"></div>\n    <noscript><p style="padding:24px;font-family:sans-serif">${escape(description)}</p></noscript>`,
    );
}

const written = [];
for (const lang of LANGS) {
  for (const page of PAGES) {
    const path = pathFor(lang, page);
    const file = resolve(DIST, fileFor(path));
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, render(lang, page));
    written.push({ path, page });
  }
}

// unknown addresses: the German start page, marked "noindex"; the app sends the visitor home
writeFileSync(resolve(DIST, '404.html'), render(DEFAULT_LANG, '', { noindex: true }));

writeFileSync(resolve(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n${SITE_URL ? `\nSitemap: ${SITE_URL}/sitemap.xml\n` : ''}`);

if (SITE_URL) {
  const urls = written
    .map(({ path, page }) => {
      const alternates = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${SITE_URL}${pathFor(l, page)}"/>`).join('\n');
      return `  <url>\n    <loc>${SITE_URL}${path}</loc>\n${alternates}\n  </url>`;
    })
    .join('\n');
  writeFileSync(
    resolve(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`,
  );
}

console.log(`prerender: ${written.length} pages${SITE_URL ? ` for ${SITE_URL}, sitemap.xml` : ' (SITE_URL not set: no canonical, hreflang or sitemap yet)'}`);

// The Impressum is required by law in Germany: warn loudly while it still has the example address
if (/Musterstraße/i.test(IMPRINT.street)) {
  console.warn('\n⚠  Impressum: src/data/site.js (IMPRINT) still has the example address. Fill it in before going live.\n');
}
