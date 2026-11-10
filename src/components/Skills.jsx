// Skills as keyboard keys (they press down on hover), and spoken languages
// on the real CEFR scale from A1 to C2.
import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import { MAIN_SKILLS, SKILLS } from '../data/site';

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

function LevelScale({ level, label }) {
  // native speakers fill the whole scale
  const reached = level === 'native' ? CEFR.length : CEFR.indexOf(level) + 1;
  return (
    <div className="cefr" role="img" aria-label={label}>
      {CEFR.map((step, i) => (
        <span key={step} className={`cefr__step ${i < reached ? 'is-on' : ''}`}>
          {step}
        </span>
      ))}
    </div>
  );
}

export default function Skills() {
  const { t } = useTranslation();
  const languages = t('skills.languages', { returnObjects: true });

  return (
    <section className="section" id="skills" aria-labelledby="skills-title">
      <div className="section__head">
        <FlapText as="h2" id="skills-title" className="section__title" text={t('skills.title')} />
      </div>

      <div className="keyboard">
        {Object.entries(SKILLS).map(([group, items]) => (
          <div key={group} className="keyboard__row">
            <h3 className="keyboard__label">{t(`skills.groups.${group}`)}</h3>
            <ul className="keyboard__keys">
              {items.map((s) => (
                <li key={s} className={`key ${MAIN_SKILLS.includes(s) ? 'key--main' : ''}`}>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="langs">
        <h3 className="langs__title">{t('skills.languagesTitle')}</h3>
        <ul className="langs__list">
          {languages.map((l) => (
            <li key={l.name} className="langs__item">
              <p className="langs__name">{l.name}</p>
              <p className="langs__level">{l.level}</p>
              <LevelScale level={l.cefr} label={`${l.name}: ${l.level}. ${t('skills.scale')}`} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
