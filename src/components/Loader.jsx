// First-visit loader "Growth":
//   1. the strokes of the AN mark grow up from the baseline, the yellow stem last
//   2. while the page is still loading, the stem blinks like a text cursor
//   3. when the page is ready, the mark gives a small spring, flies into the header
//      and the backdrop fades away
// Every movement is a CSS or Web Animations transform/opacity, which the browser runs
// off the main thread: it stays smooth on slow phones and slow connections, while the
// JavaScript and the 3D scene are still being loaded and parsed.
// Skipped for "reduce motion" and after the first visit in this browser tab.
import { useLayoutEffect, useRef, useState } from 'react';
import GrowMark from './GrowMark';
import { lockInteraction, markLoaderDone, prefersReducedMotion } from '../lib/motion';

const SEEN_KEY = 'an-loader-seen';
const INTRO_MS = 1750; // the growth animation, see .grow-mark in _base.scss
const MAX_WAIT_MS = 6000; // never keep the visitor waiting longer than this for the 3D scene

function alreadySeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // storage blocked: the loader will simply play again next time
  }
}

// the page is "ready" when fonts and the 3D scene code are loaded
function pageReady() {
  const scene = import('../scenes/FactoryScene');
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, MAX_WAIT_MS));
  return Promise.race([Promise.all([scene, fonts]), timeout]);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

export default function Loader() {
  const [visible, setVisible] = useState(() => !prefersReducedMotion() && !alreadySeen());
  const markRef = useRef(null);
  const backdropRef = useRef(null);

  useLayoutEffect(() => {
    if (!visible) {
      markLoaderDone();
      return undefined;
    }
    const root = document.documentElement;
    root.classList.add('is-loading');
    // nothing can be scrolled or clicked until the loader is gone
    const unlock = lockInteraction();
    window.scrollTo(0, 0);
    let cancelled = false;
    const animations = [];

    const finish = () => {
      root.classList.remove('is-loading');
      unlock();
      markSeen();
      markLoaderDone();
      setVisible(false);
    };

    const fly = async () => {
      const mark = markRef.current;
      // stop blinking, so the stem is visible during the flight
      mark.firstElementChild.classList.remove('is-waiting');
      const target = document.querySelector('.site-header .logo-mark');
      // a small spring before take-off
      const spring = mark.animate([{ transform: 'none' }, { transform: 'scale(1.08)' }, { transform: 'none' }], {
        duration: 240,
        easing: 'ease-in-out',
      });
      animations.push(spring);
      await spring.finished;
      if (cancelled) return;

      const from = mark.getBoundingClientRect();
      const to = target?.getBoundingClientRect();
      if (to && to.width) {
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const flight = mark.animate(
          [{ transform: 'none' }, { transform: `translate(${dx}px, ${dy}px) scale(${to.width / from.width})` }],
          { duration: 700, easing: EASE, fill: 'forwards' },
        );
        animations.push(flight);
      }
      const fade = backdropRef.current.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 500,
        delay: 150,
        easing: 'ease-out',
        fill: 'forwards',
      });
      animations.push(fade);
      await Promise.all(animations.map((a) => a.finished));
      if (!cancelled) finish();
    };

    Promise.all([pageReady(), wait(INTRO_MS)]).then(() => {
      // one frame later, so the header is laid out before we measure it
      if (!cancelled) requestAnimationFrame(() => fly().catch(() => {}));
    });

    return () => {
      cancelled = true;
      animations.forEach((a) => a.cancel());
      root.classList.remove('is-loading');
      unlock();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="loader" aria-hidden="true">
      <div ref={backdropRef} className="loader__backdrop" />
      <div ref={markRef} className="loader__mark">
        <GrowMark waiting />
      </div>
    </div>
  );
}
