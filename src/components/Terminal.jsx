// Easter egg: a small terminal. Opens with the key left of "1" or the button in the header.
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { pathFor, saveLang } from '../lib/lang';
import { useRoute } from '../lib/routing';
import { useTranslation } from 'react-i18next';
import { CONTACT, CV, LANGS, SKILLS } from '../data/site';
import { scrollToId } from '../lib/motion';

const SECTIONS = ['projects', 'journey', 'skills', 'contact'];

// The key left of "1" opens and closes the terminal. e.code names the physical key,
// so it works on every keyboard layout (Ukrainian: "'", German: "^", English: "`").
export const isTerminalKey = (e) => e.code === 'Backquote' || e.key === '`' || e.key === '~';
const PROMPT = 'andrii@hagen:~$';

export default function Terminal({ open, onClose }) {
  const { t, i18n } = useTranslation();
  const { lang, page } = useRoute();
  const navigate = useNavigate();
  const [lines, setLines] = useState([]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const input = useRef(null);
  const screen = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement;
      if (!lines.length) setLines([{ kind: 'out', text: (tr) => tr('terminal.welcome') }]);
      requestAnimationFrame(() => input.current?.focus());
    } else {
      opener.current?.focus?.();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    screen.current?.scrollTo(0, screen.current.scrollHeight);
  }, [lines]);

  const run = (raw) => {
    const cmd = raw.trim();
    const [name, ...args] = cmd.split(/\s+/);
    // Output is stored as a function of t(), not as a ready string,
    // so the whole history re-translates when the language changes.
    const out = (text) => ({ kind: 'out', text });
    const result = [{ kind: 'in', text: cmd }];

    switch (name.toLowerCase()) {
      case '':
        break;
      case 'help':
        result.push(out((t) => t('terminal.help')));
        break;
      case 'about':
      case 'whoami':
        result.push(out((t) => `${t('hero.name')}. ${t('hero.role')}.\n${t('about.text')}`));
        break;
      case 'projects':
        result.push(
          out((t) =>
            [...t('projects.featured', { returnObjects: true }), ...t('projects.earlier', { returnObjects: true })]
              .map((p) => `• ${p.name}: ${p.summary}`)
              .join('\n'),
          ),
        );
        break;
      case 'skills':
        result.push(
          out((t) =>
            Object.entries(SKILLS)
              .map(([g, s]) => `${t(`skills.groups.${g}`)}: ${s.join(', ')}`)
              .join('\n'),
          ),
        );
        break;
      case 'contact':
        result.push(out((t) => `${CONTACT.email}\n${CONTACT.linkedin}\n${CONTACT.github}`));
        break;
      case 'cv': {
        const a = document.createElement('a');
        a.href = `${import.meta.env.BASE_URL}${CV[i18n.language]}`;
        a.download = '';
        a.click();
        result.push(out((t) => t('terminal.cvStarted')));
        break;
      }
      case 'lang': {
        const next = (args[0] || '').toLowerCase();
        if (LANGS.includes(next)) {
          saveLang(next);
          navigate(pathFor(next, page), { replace: true, preventScrollReset: true });
          result.push(out((t) => t('terminal.langSwitched', { lang: next.toUpperCase() })));
        } else result.push(out((t) => t('terminal.langUnknown')));
        break;
      }
      case 'goto': {
        const id = (args[0] || '').toLowerCase();
        if (SECTIONS.includes(id)) {
          onClose();
          setTimeout(() => scrollToId(id), 50);
        } else result.push(out((t) => t('terminal.gotoUnknown')));
        break;
      }
      case 'sudo':
        if (args[0] === 'hire-me') {
          result.push(out((t) => t('terminal.hire')));
          window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent('Job offer')}`;
        } else result.push(out((t) => t('terminal.sudo')));
        break;
      case 'clear':
        setLines([]);
        return;
      case 'exit':
        onClose();
        return;
      default:
        result.push(out((t) => t('terminal.notFound', { cmd: name })));
    }
    setLines((l) => [...l, ...result]);
  };

  const onKeyDown = (e) => {
    // the same key that opened the terminal closes it again (instead of typing the character)
    if (e.key === 'Escape' || isTerminalKey(e)) {
      e.preventDefault();
      // stop here: otherwise the page-wide shortcut would see the same key and reopen it
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'ArrowUp' && history.length) {
      e.preventDefault();
      const next = Math.min(history.length - 1, cursor + 1);
      setCursor(next);
      setValue(history[history.length - 1 - next]);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(-1, cursor - 1);
      setCursor(next);
      setValue(next === -1 ? '' : history[history.length - 1 - next]);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    if (value.trim()) setHistory((h) => [...h, value.trim()]);
    setCursor(-1);
    run(value);
    setValue('');
  };

  if (!open) return null;

  return (
    <div className="terminal" role="dialog" aria-modal="false" aria-label={t('terminal.title')} lang={lang}>
      <div className="terminal__bar">
        <span>{t('terminal.title')}</span>
        <button type="button" onClick={onClose} aria-label={t('terminal.close')}>
          ×
        </button>
      </div>
      <div ref={screen} className="terminal__screen" onClick={() => input.current?.focus()} aria-live="polite" data-lenis-prevent>
        {lines.map((l, i) => (
          <pre key={i} className={`terminal__line terminal__line--${l.kind}`}>
            {l.kind === 'in' && <span className="terminal__prompt">{PROMPT} </span>}
            {typeof l.text === 'function' ? l.text(t) : l.text}
          </pre>
        ))}
        <form onSubmit={submit} className="terminal__form">
          <label htmlFor="terminal-input" className="terminal__prompt">
            {PROMPT}
            <span className="visually-hidden"> {t('terminal.inputLabel')}</span>
          </label>
          <input
            id="terminal-input"
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>
      </div>
    </div>
  );
}
