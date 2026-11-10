import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import de from './locales/de.json';
import uk from './locales/uk.json';
import { LANGS } from './data/site';
import { firstVisitLanguage } from './lib/lang';

// The language comes from the URL; on a first visit to the German root the
// visitor may be sent to /en or /uk first (see firstVisitLanguage in lib/lang.js).
const startLang = firstVisitLanguage();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de }, uk: { translation: uk } },
  lng: startLang,
  fallbackLng: 'en',
  supportedLngs: LANGS,
  interpolation: { escapeValue: false }, // React already escapes
});

export default i18n;
