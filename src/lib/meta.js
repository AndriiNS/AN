// Tab title and description of every page. Used in the browser (App.jsx) and at
// build time (scripts/prerender.mjs writes the same values into each HTML file).
import { LEGAL } from '../pages/legal/content';

const LEGAL_KIND = { impressum: 'imprint', datenschutz: 'privacy' };
const LEGAL_DESC = { imprint: 'meta.imprintDesc', privacy: 'meta.privacyDesc' };

// t: i18next t() for the page language
export function pageMeta(t, lang, page) {
  const kind = LEGAL_KIND[page];
  if (!kind) return { title: t('meta.title'), description: t('meta.description') };
  return {
    title: `${(LEGAL[lang] || LEGAL.en)[kind].title} · Andrii Naumov`,
    description: t(LEGAL_DESC[kind]),
  };
}
