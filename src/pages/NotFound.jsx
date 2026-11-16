// Shown for an address that does not exist. Cloudflare already answers such a request
// with status 404 and this page's HTML (see wrangler.jsonc, not_found_handling), so the
// address stays in the bar instead of quietly jumping to the start page: the visitor can
// see what went wrong and fix the link.
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { pathFor } from '../lib/lang';
import { TransitionLink, useRoute } from '../lib/routing';

export default function NotFound() {
  const { t } = useTranslation();
  const { lang } = useRoute();

  return (
    <>
      <Header isHome={false} />
      <main id="main" className="page not-found">
        <p className="not-found__code">{t('notFound.code')}</p>
        <h1 className="not-found__title">{t('notFound.title')}</h1>
        <p className="not-found__text">{t('notFound.text')}</p>
        <div className="not-found__actions">
          <TransitionLink className="btn btn--primary" to={pathFor(lang)}>
            {t('notFound.home')}
          </TransitionLink>
          <a className="btn" href={`${pathFor(lang)}#projects`}>
            {t('notFound.projects')}
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
