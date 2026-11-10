import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGS } from './data/site';
import { DEFAULT_LANG, pathFor } from './lib/lang';
import { PageTransitions, useRoute } from './lib/routing';
import { pageMeta } from './lib/meta';
import Home from './pages/Home';
import LegalPage from './pages/LegalPage';

// One route for everything: the language and the page are read from the URL
// (see lib/lang.js). Because it is always the same element, switching language
// keeps the page mounted: no reload of the 3D scene, scroll position stays.
function Shell() {
  const { lang, page, known } = useRoute();
  const { i18n, t } = useTranslation();

  useEffect(() => {
    if (i18n.language === lang) return undefined;
    i18n.changeLanguage(lang);
    // body text fades in (see _base.scss); headings flip on their own (FlapText)
    document.body.classList.add('is-switching');
    const timer = setTimeout(() => document.body.classList.remove('is-switching'), 500);
    return () => clearTimeout(timer);
  }, [lang, i18n]);

  // <html lang>, title, description and hreflang links for search engines
  useEffect(() => {
    document.documentElement.lang = lang;
    const meta = pageMeta(t, lang, page);
    document.title = meta.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
    document.querySelectorAll('link[data-hreflang]').forEach((el) => el.remove());
    const origin = window.location.origin + import.meta.env.BASE_URL.replace(/\/$/, '');
    [...LANGS, 'x-default'].forEach((l) => {
      const link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = l;
      link.href = origin + pathFor(l === 'x-default' ? DEFAULT_LANG : l, page);
      link.dataset.hreflang = '';
      document.head.appendChild(link);
    });
  }, [lang, page, t, i18n.language]);

  if (!known) return <Navigate to={pathFor(lang)} replace />;
  if (page === 'impressum') return <LegalPage kind="imprint" />;
  if (page === 'datenschutz') return <LegalPage kind="privacy" />;
  return <Home />;
}

export default function App() {
  return (
    <PageTransitions>
      <Routes>
        <Route path="*" element={<Shell />} />
      </Routes>
    </PageTransitions>
  );
}
