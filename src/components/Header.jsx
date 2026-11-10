import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LANGS } from '../data/site';
import { scrollToId } from '../lib/motion';
import { pathFor, saveLang } from '../lib/lang';
import { TransitionLink, useRoute } from '../lib/routing';
import LogoMark from './LogoMark';

const SECTIONS = ['projects', 'journey', 'skills', 'contact'];

function LangSwitch() {
  const { lang, page } = useRoute();
  const { t } = useTranslation();

  return (
    <nav className="lang-switch" aria-label={t('nav.language')}>
      {LANGS.map((l) => (
        <Link
          key={l}
          to={pathFor(l, page)}
          replace
          preventScrollReset
          hrefLang={l}
          lang={l}
          className={l === lang ? 'is-active' : ''}
          aria-current={l === lang ? 'true' : undefined}
          onClick={() => saveLang(l)} // remember the choice for the next visit
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}

export default function Header({ onTerminal, isHome = true }) {
  const { t } = useTranslation();
  const { lang } = useRoute();

  const go = (id) => (e) => {
    e.preventDefault();
    scrollToId(id);
  };

  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        {t('nav.skip')}
      </a>
      {/* the bar spans the window, its content stays in the page container */}
      <div className="site-header__inner">
        <TransitionLink
          to={pathFor(lang)}
          className="logo"
          aria-label={t('nav.home')}
          onClick={(e) => {
            // already home: just scroll to the top
            if (isHome) {
              e.preventDefault();
              scrollToId('top');
            }
          }}
        >
          <LogoMark />
          <span className="logo__text">Andrii Naumov</span>
        </TransitionLink>

        {isHome && (
          <nav className="site-nav" aria-label={t('nav.main')}>
            {SECTIONS.map((id) => (
              <a key={id} href={`#${id}`} onClick={go(id)}>
                {t(`nav.${id}`)}
              </a>
            ))}
          </nav>
        )}

        <div className="site-header__tools">
          <LangSwitch />
          {onTerminal && (
            <button type="button" className="terminal-btn" onClick={onTerminal} aria-keyshortcuts="`">
              <span aria-hidden="true">&gt;_</span>
              <span className="terminal-btn__label">{t('nav.terminal')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
