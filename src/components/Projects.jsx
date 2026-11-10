import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import Inspectable from './Inspectable';
import { PROJECT_LINKS } from '../data/site';

function Links({ id }) {
  const { t } = useTranslation();
  const links = PROJECT_LINKS[id] || {};
  if (!links.live && !links.code) return null;
  return (
    <p className="project__links">
      {links.live && (
        <a href={links.live} target="_blank" rel="noreferrer">
          {t('projects.live')}
        </a>
      )}
      {links.code && (
        <a href={links.code} target="_blank" rel="noreferrer">
          {t('projects.code')}
        </a>
      )}
    </p>
  );
}

function Stack({ items }) {
  return (
    <ul className="stack">
      {items.map((s) => (
        <li key={s}>{s}</li>
      ))}
    </ul>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const featured = t('projects.featured', { returnObjects: true });
  const earlier = t('projects.earlier', { returnObjects: true });

  return (
    <section className="section" id="projects" aria-labelledby="projects-title">
      <div className="section__head">
        <FlapText as="h2" id="projects-title" className="section__title" text={t('projects.title')} />
        <p className="section__intro">{t('projects.intro')}</p>
      </div>

      <div className="featured">
        {featured.map((p) => (
          <Inspectable as="article" key={p.id} selector={`article#${p.id}`} className="project project--featured">
            <div className="project__meta">
              <span className="project__year">{p.year}</span>
              <Stack items={p.stack} />
            </div>
            <div className="project__body">
              <h3 className="project__name">{p.name}</h3>
              <p className="project__summary">{p.summary}</p>
              <p className="project__detail">{p.detail}</p>
              {p.id === 'parser' && <p className="project__note">{t('projects.nda')}</p>}
              <Links id={p.id} />
            </div>
          </Inspectable>
        ))}
      </div>

      <h3 className="earlier__title">{t('projects.earlierTitle')}</h3>
      <ul className="earlier">
        {earlier.map((p) => (
          <Inspectable as="li" key={p.id} selector={`li.project`} className="project project--small">
            <h4 className="project__name">{p.name}</h4>
            <p className="project__summary">{p.summary}</p>
            <Stack items={p.stack} />
            <Links id={p.id} />
          </Inspectable>
        ))}
      </ul>
    </section>
  );
}
