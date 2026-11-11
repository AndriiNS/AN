import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import Inspectable from './Inspectable';
import { CASES, PROJECT_LINKS } from '../data/site';

const BASE = import.meta.env.BASE_URL;
// the preview box is 16:10; on hover the screenshot scrolls to its bottom edge
const BOX_RATIO = 10 / 16;

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

// a client website: a browser window with a real screenshot, and the story next to it
function Case({ item }) {
  const { t } = useTranslation();
  const data = CASES[item.id];
  const host = new URL(data.url).host;
  const pan = `${-(1 - BOX_RATIO / data.ratio) * 100}%`;

  return (
    <article className="case" id={item.id}>
      <a className="case__preview" href={data.url} target="_blank" rel="noreferrer" aria-label={`${item.name}: ${host}`}>
        <span className="case__bar" aria-hidden="true">
          <span className="case__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="case__url">{host}</span>
        </span>
        <span className="case__screen">
          <img
            src={`${BASE}projects/${item.id}.webp`}
            srcSet={`${BASE}projects/${item.id}-620.webp 620w, ${BASE}projects/${item.id}.webp 1240w`}
            sizes="(max-width: 860px) 100vw, 55vw"
            width="1240"
            height={Math.round(1240 * data.ratio)}
            alt={t('projects.previewAlt', { name: item.name })}
            loading="lazy"
            decoding="async"
            style={{ '--pan': pan }}
          />
        </span>
      </a>

      <div className="case__body">
        <p className="case__kind">{item.kind}</p>
        <h3 className="case__name">{item.name}</h3>
        <p className="case__summary">{item.summary}</p>
        <h4 className="case__role-title">{t('projects.roleTitle')}</h4>
        <ul className="case__role">
          {item.role.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <Stack items={item.stack} />
        <p className="project__links">
          <a href={data.url} target="_blank" rel="noreferrer">
            {t('projects.live')}
            <span aria-hidden="true"> ↗</span>
          </a>
          {data.caseUrl && (
            <a href={data.caseUrl} target="_blank" rel="noreferrer">
              {t('projects.caseStudy')}
              <span aria-hidden="true"> ↗</span>
            </a>
          )}
        </p>
        {data.ua && <p className="case__hosted">{t('projects.hosted')}</p>}
      </div>
    </article>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const cases = t('projects.cases', { returnObjects: true });
  const featured = t('projects.featured', { returnObjects: true });
  const earlier = t('projects.earlier', { returnObjects: true });

  return (
    <section className="section" id="projects" aria-labelledby="projects-title">
      <div className="section__head">
        <FlapText as="h2" id="projects-title" className="section__title" text={t('projects.title')} />
        <p className="section__intro">{t('projects.intro')}</p>
      </div>

      <div className="cases">
        {cases.map((c) => (
          <Case key={c.id} item={c} />
        ))}
      </div>

      <h3 className="earlier__title">{t('projects.workTitle')}</h3>
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
