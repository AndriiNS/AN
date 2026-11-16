// Tab title and description of every page. Used in the browser (App.jsx) and at
// build time (scripts/prerender.mjs writes the same values into each HTML file).
import { LEGAL } from '../pages/legal/content';

const LEGAL_KIND = { impressum: 'imprint', datenschutz: 'privacy' };
const LEGAL_DESC = { imprint: 'meta.imprintDesc', privacy: 'meta.privacyDesc' };

// t: i18next t() for the page language.
// `title` and `description` are what Google shows; `ogTitle` and `ogDescription` are the
// shorter versions for link previews, which cut titles at about 60 characters and
// descriptions at about 125. Pages other than the start page already have short ones.
export function pageMeta(t, lang, page) {
  const kind = LEGAL_KIND[page];
  if (!kind) {
    return {
      title: t('meta.title'),
      description: t('meta.description'),
      ogTitle: t('meta.ogTitle'),
      ogDescription: t('meta.ogDesc'),
    };
  }
  const title = `${(LEGAL[lang] || LEGAL.en)[kind].title} · Andrii Naumov`;
  return { title, description: t(LEGAL_DESC[kind]), ogTitle: title, ogDescription: t(LEGAL_DESC[kind]) };
}

// the address does not exist (see pages/NotFound.jsx)
export function notFoundMeta(t) {
  const title = `${t('notFound.title')} · Andrii Naumov`;
  return { title, description: t('notFound.text'), ogTitle: title, ogDescription: t('notFound.text') };
}
