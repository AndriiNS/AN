// Everything that is the same in all languages: links, files, skills.
// Texts live in src/locales/*.json.

export const LANGS = ['en', 'de', 'uk'];

// The address of the live site, without a slash at the end, e.g. 'https://andriinaumov.dev'.
// Used at build time for canonical links, hreflang, the sitemap and link previews
// (scripts/prerender.mjs). Can also be set as the SITE_URL environment variable
// in the Cloudflare build settings. Leave empty until the domain works.
export const SITE_URL = '';

export const CONTACT = {
  email: 'andriy.naumov05@gmail.com',
  linkedin: 'https://www.linkedin.com/in/andrii-naumov-a09540283',
  github: 'https://github.com/AndriiNS',
};

// Put a CV for every language into public/cv/. Until the DE and UK versions exist,
// all languages point to the English file.
export const CV = {
  en: 'cv/Andrii_Naumov_CV_EN.pdf',
  de: 'cv/Andrii_Naumov_CV_EN.pdf',
  uk: 'cv/Andrii_Naumov_CV_EN.pdf',
};

// Client websites (freelance, mostly with the Apex Webcraft studio). Texts are in
// src/locales/*.json under projects.cases, matched by id. Screenshots live in
// public/projects/: <id>.webp (1240 px wide) and <id>-620.webp; `ratio` is height / width
// of the screenshot, used to scroll the preview on hover.
export const CASES = {
  christmas: { url: 'https://christmas-tree.in.ua/', caseUrl: 'https://apexwebcraft.com.ua/cases/christmas/', ratio: 980 / 1240, ua: true },
  cardetail: { url: 'https://cardetail.km.ua/', caseUrl: 'https://apexwebcraft.com.ua/cases/apexdetail/', ratio: 980 / 1240, ua: true },
  apex: { url: 'https://apexwebcraft.com.ua/', ratio: 889 / 1240, ua: true },
};

// Links for the projects in src/locales/*.json (matched by id)
export const PROJECT_LINKS = {
  parser: {},
  landings: {},
  midas: { live: 'https://andriins.github.io/MIDAS/', code: 'https://github.com/AndriiNS/MIDAS' },
  agency: { live: 'https://andriins.github.io/agency-creative/', code: 'https://github.com/AndriiNS/agency-creative' },
  '2rism': { live: 'https://andriins.github.io/2rism/', code: 'https://github.com/AndriiNS/2rism' },
};

export const SKILLS = {
  frontend: ['HTML5', 'CSS3', 'SCSS', 'JavaScript (ES6+)', 'React'],
  backend: ['PHP', 'Python', 'REST API', 'AJAX', 'MySQL', 'MongoDB'],
  cms: ['WordPress', 'WooCommerce', 'ACF'],
  motion: ['GSAP', 'Three.js', 'Swiper.js', 'ScrollReveal'],
  tools: ['Git', 'Figma', 'Vite'],
};

// Skills drawn as blue keys: the main stack
export const MAIN_SKILLS = ['JavaScript (ES6+)', 'React', 'SCSS', 'PHP', 'Python', 'WordPress', 'GSAP'];

// Data for the Impressum and the privacy policy (src/pages/legal/*).
// § 5 DDG asks for a name, an address where you can receive post (no PO box)
// and two fast ways to contact you: email plus, for example, a phone number.
// Replace every TODO before publishing the site.
export const IMPRINT = {
  name: 'Andrii Naumov',
  street: 'Musterstraße 1', // TODO: your street and house number
  city: '58095 Hagen', // TODO: your postcode and city
  country: 'Deutschland',
  email: CONTACT.email,
  phone: '', // TODO: your phone number, e.g. '+49 151 00000000'
};

// Hosting provider, named in the privacy policy. Change it if you move the site.
export const HOSTING = {
  name: 'Cloudflare Workers',
  provider: 'Cloudflare',
  company: 'Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA',
  privacyUrl: 'https://www.cloudflare.com/privacypolicy/',
};

// Data protection authority for North Rhine-Westphalia (where Hagen is)
export const AUTHORITY = {
  name: 'Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen',
  address: 'Kavalleriestraße 2–4, 40213 Düsseldorf',
  url: 'https://www.ldi.nrw.de',
};
