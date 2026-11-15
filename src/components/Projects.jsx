import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import Inspectable from './Inspectable';
import { CASES, PROJECT_LINKS } from '../data/site';

const BASE = import.meta.env.BASE_URL;
// the preview box is 16:10; on hover the screenshot scrolls to its bottom edge
const BOX_RATIO = 10 / 16;
const panFor = (ratio) => `${-(1 - BOX_RATIO / ratio) * 100}%`;

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

// The screenshot inside a browser window. One shot per case, except the internal tool,
// which has three: the thumbnails below the window switch between them.
function Screens({ item, data }) {
  const { t } = useTranslation();
  const shots = data.shots || [data.ratio];
  const [shot, setShot] = useState(0);
  const file = (i, small) => `${BASE}projects/${item.id}${shots.length > 1 ? `-${i + 1}` : ''}${small ? '-620' : ''}.webp`;

  const frame = (
    <>
      <span className="case__bar" aria-hidden="true">
        <span className="case__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="case__url">{data.url ? new URL(data.url).host : data.host}</span>
      </span>
      <span className="case__screen">
        <img
          key={shot}
          src={file(shot)}
          srcSet={`${file(shot, true)} 620w, ${file(shot)} 1240w`}
          sizes="(max-width: 860px) 100vw, 55vw"
          width="1240"
          height={Math.round(1240 * shots[shot])}
          alt={t('projects.previewAlt', { name: item.name })}
          loading="lazy"
          decoding="async"
          style={{ '--pan': panFor(shots[shot]) }}
        />
      </span>
    </>
  );

  return (
    <div className="case__media">
      {data.url ? (
        <a className="case__preview" href={data.url} target="_blank" rel="noreferrer" aria-label={`${item.name}: ${new URL(data.url).host}`}>
          {frame}
        </a>
      ) : (
        <div className="case__preview case__preview--static">{frame}</div>
      )}

      {shots.length > 1 && (
        <div className="case__shots">
          {shots.map((ratio, i) => (
            <button
              key={i}
              type="button"
              className={`case__shot ${i === shot ? 'is-active' : ''}`}
              aria-label={t('projects.shot', { n: i + 1 })}
              aria-pressed={i === shot}
              onClick={() => setShot(i)}
              onMouseEnter={() => setShot(i)}
            >
              <img src={file(i, true)} alt="" width="620" height={Math.round(620 * ratio)} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// a piece of work: the screenshot on one side, the story on the other
function Case({ item }) {
  const { t } = useTranslation();
  const data = CASES[item.id];

  return (
    <article className="case" id={item.id}>
      <Screens item={item} data={data} />

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
        {(data.url || data.caseUrl) && (
          <p className="project__links">
            {data.url && (
              <a href={data.url} target="_blank" rel="noreferrer">
                {t('projects.live')}
                <span aria-hidden="true"> ↗</span>
              </a>
            )}
            {data.caseUrl && (
              <a href={data.caseUrl} target="_blank" rel="noreferrer">
                {t('projects.caseStudy')}
                <span aria-hidden="true"> ↗</span>
              </a>
            )}
          </p>
        )}
        {data.nda && <p className="case__hosted">{t('projects.nda')}</p>}
        {data.ua && <p className="case__hosted">{t('projects.hosted')}</p>}
      </div>
    </article>
  );
}

export default function Projects() {
  const { t } = useTranslation();
  const cases = t('projects.cases', { returnObjects: true });
  const featured = t('projects.featured', { returnObjects: true });

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
              <Links id={p.id} />
            </div>
          </Inspectable>
        ))}
      </div>
    </section>
  );
}
