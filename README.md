# Andrii Naumov · Portfolio

Personal site of Andrii Naumov, web developer and process automation, based in Hagen, Germany.
Three languages (German, English, Ukrainian), a scroll-driven 3D scene and a few small surprises.

**Stack:** React 18 · Vite 5 · JavaScript (no TypeScript, on purpose) · Three.js via React Three Fiber and drei · GSAP + ScrollTrigger · Lenis · SCSS · react-i18next · Cloudflare Pages

## What's inside

- **3D hero: Build → Automate → Ship.** A small web page made of soft 3D blocks tells the story while you scroll. A blueprint grows into a page block by block, a script scans it while tasks run along a conveyor through an `auto.py` gate, and finally the layout rebuilds itself into a phone and goes live. (`src/scenes/HeroScene.jsx`)
- **Three languages without reloads.** German lives at `/`, English at `/en`, Ukrainian at `/uk`. Headings flip like a split-flap departure board when the language changes. On the first visit the language is picked from the visitor's choice, browser languages and time zone, all in the browser, no IP lookups. (`src/lib/lang.js`, `src/components/FlapText.jsx`)
- **Journey map.** A dotted map of Europe, generated once from Natural Earth data, with the route Khmelnytskyi → Kyiv → Hagen drawn by scroll. (`scripts/build-map.mjs`, `src/components/Journey.jsx`)
- **Terminal.** Press the key left of <kbd>1</kbd> (works on any keyboard layout) and type `help`. Try `sudo hire-me`.
- **Logo loader and page transitions.** The AN monogram grows stroke by stroke and flies into the header; legal pages open behind a curtain. Nothing on the page can be scrolled or clicked while they play.
- **Built for a German audience.** Impressum and Datenschutzerklärung, no cookies, no tracking, fonts bundled with the site, strict Content Security Policy.
- **Accessible.** Respects `prefers-reduced-motion`, keyboard friendly, real text behind every animation for screen readers and search engines.
- **SEO.** Every address gets its own pre-rendered HTML with language, title, description, `hreflang`, canonical link, Open Graph image and a sitemap. (`scripts/prerender.mjs`)

## Run it

Node 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the build locally
```

To check the build exactly as Cloudflare Pages serves it (headers, redirects, clean URLs):

```bash
npx wrangler pages dev dist
```

## Project structure

```
src/
  main.jsx, App.jsx       entry point, one route that reads language and page from the URL
  locales/                all texts: de.json, en.json, uk.json
  data/site.js            links, skills, CV files, Impressum data, SITE_URL
  scenes/HeroScene.jsx    the 3D scene
  components/             Hero, About, Projects, Journey, Skills, Contact, Terminal, Loader…
  lib/                    motion (GSAP, Lenis, interaction lock), languages, routing, page meta
  pages/                  Home and the legal pages
  styles/                 SCSS, one file per area, design tokens in _tokens.scss
public/
  _headers, _redirects    Cloudflare Pages configuration
  favicon.svg, og-image.png, apple-touch-icon.png, cv/
scripts/
  prerender.mjs           writes one HTML file per address after the Vite build
  build-map.mjs           generates the dotted map of Europe
docs/README.uk.md         detailed notes in Ukrainian
```

## Deployment

Cloudflare Pages, connected to this repository:

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Environment variable | `SITE_URL` = `https://your-domain` |

Node version comes from `.node-version`. Every push to `main` deploys; other branches get preview URLs.

## Contact

[LinkedIn](https://www.linkedin.com/in/andrii-naumov-a09540283) · [GitHub](https://github.com/AndriiNS)

© Andrii Naumov. The code is here to read and learn from; the texts, the logo and the personal data are not for reuse.
