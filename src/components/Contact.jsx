// Contact: a dark panel at the end of the page with a big email,
// a copy button and the current time in Hagen.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import ContactForm from './ContactForm';
import { CONTACT, CV, IMPRINT } from '../data/site';

const LOCALES = { en: 'en-GB', de: 'de-DE', uk: 'uk-UA' };

function useHagenTime(lang) {
  const format = () =>
    new Intl.DateTimeFormat(LOCALES[lang] || 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    }).format(new Date());
  const [time, setTime] = useState(format);
  useEffect(() => {
    setTime(format());
    const id = setInterval(() => setTime(format()), 15_000);
    return () => clearInterval(id);
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps
  return time;
}

export default function Contact() {
  const { t, i18n } = useTranslation();
  const [copied, setCopied] = useState(false);
  const time = useHagenTime(i18n.language);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT.email);
    } catch {
      // clipboard blocked: select the address so the visitor can copy it by hand
      const range = document.createRange();
      range.selectNodeContents(document.querySelector('.contact__email'));
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title">
      <div className="contact__panel">
        <div className="contact__top">
          <FlapText as="h2" id="contact-title" className="contact__title" text={t('contact.title')} />
          <p className="contact__clock">
            <span className="contact__clock-label">{t('contact.localTime')}</span>
            <span className="contact__clock-time">{time}</span>
          </p>
        </div>

        <p className="contact__text">{t('contact.text')}</p>
        {/* what a German recruiter checks first: role, work permit, where I can work */}
        <p className="contact__status">
          <span className="contact__status-dot" aria-hidden="true" />
          {t('contact.status')}
        </p>

        <div className="contact__mail">
          <a className="contact__email" href={`mailto:${CONTACT.email}`}>
            {/* on narrow screens the address breaks after the @, not in the middle of a word */}
            {CONTACT.email.split('@')[0]}@<wbr />
            {CONTACT.email.split('@')[1]}
          </a>
          <button type="button" className="contact__copy" onClick={copy} aria-live="polite">
            {copied ? t('contact.copied') : t('contact.copy')}
          </button>
        </div>

        <div className="contact__links">
          <a className="btn btn--yellow" href={`${import.meta.env.BASE_URL}${CV[i18n.language]}`} download>
            {t('contact.cv')}
          </a>
          {/* German recruiters often just call: the number appears as soon as it is
              filled in in data/site.js (it is also needed for the Impressum) */}
          {IMPRINT.phone && (
            <a className="btn btn--light" href={`tel:${IMPRINT.phone.replace(/\s/g, '')}`}>
              {IMPRINT.phone}
            </a>
          )}
          <a className="btn btn--light" href={CONTACT.linkedin} target="_blank" rel="noreferrer">
            LinkedIn
          </a>
          <a className="btn btn--light" href={CONTACT.github} target="_blank" rel="noreferrer">
            GitHub
          </a>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
