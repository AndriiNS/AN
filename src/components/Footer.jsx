import { pathFor } from '../lib/lang';
import { TransitionLink, useRoute } from '../lib/routing';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const { lang } = useRoute();
  return (
    <footer className="site-footer">
      <p>© {new Date().getFullYear()} Andrii Naumov</p>
      <p>{t('footer.built')}</p>
      <p className="site-footer__hint">{t('footer.terminalHint')}</p>
      <nav className="site-footer__legal" aria-label={t('footer.legal')}>
        <TransitionLink to={pathFor(lang, 'impressum')}>{t('footer.imprint')}</TransitionLink>
        <TransitionLink to={pathFor(lang, 'datenschutz')}>{t('footer.privacy')}</TransitionLink>
      </nav>
    </footer>
  );
}
