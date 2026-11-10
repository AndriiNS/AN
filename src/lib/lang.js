// Languages and URLs.
//
//   /                 German (the default, at the root)
//   /en, /uk          English, Ukrainian
//   /impressum        German Impressum, /en/impressum, /uk/impressum …
//   /datenschutz      German privacy policy, /en/datenschutz …
//
// German has no prefix, the other languages do.
import { LANGS } from '../data/site';

export const DEFAULT_LANG = 'de';
export const PAGES = ['', 'impressum', 'datenschutz'];
const STORAGE_KEY = 'an-lang';

// '/en/impressum' -> { lang: 'en', page: 'impressum' };  '/' -> { lang: 'de', page: '' }
export function parsePath(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  let lang = DEFAULT_LANG;
  if (parts[0] && LANGS.includes(parts[0]) && parts[0] !== DEFAULT_LANG) lang = parts.shift();
  else if (parts[0] === DEFAULT_LANG) parts.shift(); // /de/... also works, it is the same as /
  const page = parts[0] || '';
  return { lang, page, known: PAGES.includes(page) && parts.length <= 1 };
}

// the URL of a page in a language
export function pathFor(lang, page = '') {
  const prefix = lang === DEFAULT_LANG ? '' : `/${lang}`;
  return `${prefix}/${page}`.replace(/\/+$/, '') || '/';
}

// ---------- remembering the visitor's choice ----------
export function savedLang() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return LANGS.includes(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveLang(lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage blocked: the choice simply is not remembered
  }
}

// ---------- guessing the best language for a first-time visitor ----------
// Several signals, strongest first. Nothing is sent anywhere: all of it is
// read from the browser itself, so no IP lookup and nothing to declare under GDPR.
//   1. a language the visitor picked before on this site
//   2. the browser's preferred languages, in order
//   3. the device time zone (Kyiv -> Ukrainian, German-speaking countries -> German)
//   4. German
const TIMEZONES = {
  uk: ['Europe/Kyiv', 'Europe/Kiev', 'Europe/Uzhgorod', 'Europe/Zaporozhye', 'Europe/Simferopol'],
  de: ['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'Europe/Busingen', 'Europe/Vaduz'],
};

export function detectLanguage() {
  const saved = savedLang();
  if (saved) return { lang: saved, reason: 'saved' };

  const preferred = (navigator.languages?.length ? navigator.languages : [navigator.language || '']).map((l) =>
    l.toLowerCase().slice(0, 2),
  );
  const fromBrowser = preferred.find((l) => LANGS.includes(l));
  if (fromBrowser) return { lang: fromBrowser, reason: 'browser' };

  let zone = '';
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    // very old browser: skip this signal
  }
  const fromZone = Object.keys(TIMEZONES).find((l) => TIMEZONES[l].includes(zone));
  if (fromZone) return { lang: fromZone, reason: 'timezone' };

  return { lang: DEFAULT_LANG, reason: 'default' };
}

// On the very first load of an unprefixed (German) URL, send the visitor to the
// language that suits them best. Runs before React renders, so nothing flashes.
// Links that already name a language (/en, /uk) are always respected.
export function firstVisitLanguage() {
  const hashMode = Boolean(import.meta.env.VITE_HASH_ROUTER);
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const path = hashMode ? window.location.hash.slice(1) || '/' : window.location.pathname.slice(base.length) || '/';
  const { lang, page, known } = parsePath(path);
  const first = path.split('/').filter(Boolean)[0];
  // /en, /uk and also an explicit /de are choices made by the link, keep them
  if (first && LANGS.includes(first)) return lang;
  // search engines and link previews must see each address in its own language
  if (/bot|crawl|spider|slurp|preview|lighthouse|facebookexternalhit/i.test(navigator.userAgent)) return lang;

  const guess = detectLanguage();
  if (guess.lang === DEFAULT_LANG) return lang;
  const target = pathFor(guess.lang, known ? page : '');
  const url = hashMode ? `#${target}` : `${base}${target}${window.location.search}${window.location.hash}`;
  window.history.replaceState(null, '', url);
  return guess.lang;
}
