// About: a short story on the left, and on the right the same facts shown
// the way DevTools shows the computed styles of an element.
import { useTranslation } from 'react-i18next';
import Inspectable from './Inspectable';

export default function About() {
  const { t } = useTranslation();
  const facts = t('about.facts', { returnObjects: true });

  return (
    <section className="section about" id="about" aria-labelledby="about-title">
      <h2 id="about-title" className="visually-hidden">
        {t('about.title')}
      </h2>

      <p className="about__text">{t('about.text')}</p>

      <Inspectable as="div" selector="div.andrii" className="computed">
        <div className="computed__tabs" aria-hidden="true">
          <span>Styles</span>
          <span className="is-active">{t('about.panelTitle')}</span>
          <span>Layout</span>
        </div>
        <pre className="computed__code">
          <span className="computed__selector">.andrii</span> {'{'}
          {'\n'}
          {facts.map(([key, value]) => (
            <span key={key} className="computed__line">
              {'  '}
              <span className="computed__prop">{key}</span>: <span className="computed__value">{value}</span>;{'\n'}
            </span>
          ))}
          {'}'}
        </pre>
      </Inspectable>
    </section>
  );
}
