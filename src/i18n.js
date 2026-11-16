import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import uk from './locales/uk.json';
import { LANGS } from './data/site';
import { DEFAULT_LANG, firstVisitLanguage } from './lib/lang';

// The language comes from the URL; on a first visit to the German root the
// visitor may be sent to /en or /uk first (see firstVisitLanguage in lib/lang.js).
// At build time there is no browser: scripts/prerender.mjs renders every page once
// per language and sets the language itself before each render.
const startLang = typeof window === 'undefined' ? DEFAULT_LANG : firstVisitLanguage();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de }, uk: { translation: uk } },
  lng: startLang,
  fallbackLng: 'en',
  supportedLngs: LANGS,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
