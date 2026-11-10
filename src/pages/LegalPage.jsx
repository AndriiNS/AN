// Impressum and privacy policy. The texts live in ./legal/content.js,
// the personal data (address, phone) in src/data/site.js.
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { pathFor } from '../lib/lang';
import { TransitionLink, useRoute } from '../lib/routing';
import { useTranslation } from 'react-i18next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { LEGAL } from './legal/content';

function Parts({ value }) {
  const parts = Array.isArray(value) ? value : [value];
  return parts.map((part, i) =>
    typeof part === 'string' ? (
      <Fragment key={i}>{part}</Fragment>
    ) : (
      <a key={i} href={part.href} target={part.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
        {part.text}
      </a>
    ),
  );
}

export default function LegalPage({ kind }) {
  const { t } = useTranslation();
  const { lang, page: slug } = useRoute();
  const page = (LEGAL[lang] || LEGAL.en)[kind];

  return (
    <>
      <Header isHome={false} />
      <main id="main" className="page legal">
        <h1 className="legal__title">{page.title}</h1>

        {lang !== 'de' && (
          <p className="legal__note">
            {t('legal.translationNote')}{' '}
            <Link to={pathFor('de', slug)} replace>
              {t('legal.germanLink')}
            </Link>
          </p>
        )}

        {page.sections.map((s) => (
          <section key={s.h} className="legal__section">
            <h2>{s.h}</h2>
            {s.p?.map((p, i) => (
              <p key={i}>
                <Parts value={p} />
              </p>
            ))}
            {s.lines && (
              <address>
                {s.lines.map((line, i) => (
                  <Fragment key={i}>
                    <Parts value={line} />
                    <br />
                  </Fragment>
                ))}
              </address>
            )}
          </section>
        ))}

        {kind === 'privacy' && <p className="legal__updated">{t('legal.updated')}</p>}
        <p>
          <TransitionLink to={pathFor(lang)}>{t('imprint.back')}</TransitionLink>
        </p>
      </main>
      <Footer />
    </>
  );
}
