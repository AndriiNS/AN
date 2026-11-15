// A small nudge towards the terminal easter egg: the hint in the footer is too quiet,
// and almost nobody finds the key on their own. Shown once per browser, ten seconds
// after the page is ready, and only where there is a keyboard to press the key with.
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { loaderDone } from '../lib/motion';

const KEY = 'an-terminal-hint';
const DELAY_MS = 10000;
const LIFE_MS = 14000;

export default function TerminalHint({ onOpen }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    try {
      if (localStorage.getItem(KEY) === '1') return undefined;
    } catch {
      return undefined; // storage blocked: better to stay quiet than to nag every visit
    }
    let appear;
    let vanish;
    loaderDone.then(() => {
      appear = setTimeout(() => {
        setShow(true);
        vanish = setTimeout(() => setShow(false), LIFE_MS);
      }, DELAY_MS);
    });
    return () => {
      clearTimeout(appear);
      clearTimeout(vanish);
    };
  }, []);

  const seen = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      // nothing to remember, the hint simply may come back
    }
  };

  if (!show) return null;

  return (
    <div className="hint" role="status">
      <button
        type="button"
        className="hint__body"
        onClick={() => {
          seen();
          onOpen();
        }}
      >
        <span className="hint__key" aria-hidden="true">
          &gt;_
        </span>
        <span>{t('footer.terminalHint')}</span>
      </button>
      <button type="button" className="hint__close" onClick={seen} aria-label={t('terminal.hintClose')}>
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
