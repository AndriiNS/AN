// A short contact form on the dark panel. It posts to /api/contact, which is handled by
// the Cloudflare Worker (worker/index.js) and forwarded to a Telegram bot — no mail
// server, no third-party form service, nothing loaded from another domain.
//
// Two quiet defences against spam bots: a field that is hidden from people (any content
// in it means a bot), and the time it took to fill the form in.
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CONTACT } from '../data/site';
import { pathFor } from '../lib/lang';
import { TransitionLink, useRoute } from '../lib/routing';

const MIN_MESSAGE = 10;
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

export default function ContactForm() {
  const { t, i18n } = useTranslation();
  const { lang } = useRoute();
  const startedAt = useRef(Date.now());
  const [values, setValues] = useState({ name: '', email: '', message: '', consent: false, company: '' });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState('idle'); // idle | sending | ok | error

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: null } : prev));
  };

  const validate = () => {
    const next = {};
    if (!values.name.trim()) next.name = t('contact.form.errName');
    if (!isEmail(values.email.trim())) next.email = t('contact.form.errEmail');
    if (values.message.trim().length < MIN_MESSAGE) next.message = t('contact.form.errMessage');
    if (!values.consent) next.consent = t('contact.form.errConsent');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (state === 'sending' || !validate()) return;
    setState('sending');
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          message: values.message.trim(),
          company: values.company, // the honeypot, always empty for a person
          startedAt: startedAt.current,
          lang: i18n.language,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState('ok');
      setValues({ name: '', email: '', message: '', consent: false, company: '' });
    } catch {
      setState('error');
    }
  };

  const field = (name, extra = {}) => ({
    id: `contact-${name}`,
    name,
    value: values[name],
    onChange: set(name),
    'aria-invalid': errors[name] ? 'true' : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
    ...extra,
  });

  if (state === 'ok') {
    return (
      <div className="cform cform--done" role="status">
        <p className="cform__done">{t('contact.form.ok')}</p>
      </div>
    );
  }

  return (
    <form className="cform" onSubmit={submit} noValidate>
      <h3 className="cform__title">{t('contact.form.title')}</h3>

      <div className="cform__row">
        <p className="cform__field">
          <label htmlFor="contact-name">{t('contact.form.name')}</label>
          <input type="text" autoComplete="name" required {...field('name')} />
          {errors.name && (
            <span className="cform__error" id="contact-name-error">
              {errors.name}
            </span>
          )}
        </p>
        <p className="cform__field">
          <label htmlFor="contact-email">{t('contact.form.email')}</label>
          <input type="email" autoComplete="email" required {...field('email')} />
          {errors.email && (
            <span className="cform__error" id="contact-email-error">
              {errors.email}
            </span>
          )}
        </p>
      </div>

      <p className="cform__field">
        <label htmlFor="contact-message">{t('contact.form.message')}</label>
        <textarea rows="4" required placeholder={t('contact.form.messagePlaceholder')} {...field('message')} />
        {errors.message && (
          <span className="cform__error" id="contact-message-error">
            {errors.message}
          </span>
        )}
      </p>

      {/* hidden from people and from screen readers; only bots fill this in */}
      <div className="cform__trap" aria-hidden="true">
        <label htmlFor="contact-company">Company</label>
        <input type="text" id="contact-company" name="company" tabIndex="-1" autoComplete="off" value={values.company} onChange={set('company')} />
      </div>

      <p className="cform__consent">
        <input type="checkbox" required {...field('consent', { checked: values.consent, value: 'yes' })} />
        <label htmlFor="contact-consent">
          {t('contact.form.consent')}{' '}
          <TransitionLink to={pathFor(lang, 'datenschutz')}>{t('contact.form.consentLink')}</TransitionLink>
        </label>
        {errors.consent && (
          <span className="cform__error" id="contact-consent-error">
            {errors.consent}
          </span>
        )}
      </p>

      <div className="cform__foot">
        <button type="submit" className="btn btn--yellow" disabled={state === 'sending'}>
          {state === 'sending' ? t('contact.form.sending') : t('contact.form.send')}
        </button>
        <span className="cform__status" role="status">
          {state === 'error' && t('contact.form.error', { email: CONTACT.email })}
        </span>
      </div>
    </form>
  );
}
