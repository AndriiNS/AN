// First-visit loader "Growth":
//   1. the strokes of the AN mark grow up from the baseline, the yellow stem last
//   2. the mark gives a small spring
//   3. when the page is ready, it flies into the header and the loader fades away
// The intro itself lives in src/lib/logoIntro.js.
// Skipped for "reduce motion" and after the first visit in this browser tab.
import { useLayoutEffect, useRef, useState } from 'react';
import LogoMark from './LogoMark';
import { gsap, lockInteraction, prefersReducedMotion } from '../lib/motion';
import { logoIntro, resetLogo } from '../lib/logoIntro';

const SEEN_KEY = 'an-loader-seen';

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

// the page is "ready" when fonts and the 3D scene code are loaded (but never wait longer than 4 s)
function pageReady() {
  const scene = import('../scenes/HeroScene');
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const timeout = new Promise((resolve) => setTimeout(resolve, 4000));
  return Promise.race([Promise.all([scene, fonts]), timeout]);
}

export default function Loader() {
  const [visible, setVisible] = useState(() => !prefersReducedMotion() && !alreadySeen());
  const overlayRef = useRef(null);
  const markRef = useRef(null);

  useLayoutEffect(() => {
    if (!visible) return undefined;
    const root = document.documentElement;
    root.classList.add('is-loading');
    // nothing can be scrolled or clicked until the loader is gone
    const unlock = lockInteraction();
    window.scrollTo(0, 0);
    const ready = pageReady();

    const ctx = gsap.context(() => {
      const svg = markRef.current.querySelector('svg');
      const tl = logoIntro(gsap, svg);
      tl.to(markRef.current, { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1, ease: 'power1.inOut' }, '+=0.05');
      // wait here until the page is ready
      tl.add(() => {
        tl.pause();
        ready.then(() => tl.resume());
      });

      // 3. fly into the header logo and fade the backdrop
      tl.add(() => {
        resetLogo(svg);
        const target = document.querySelector('.site-header .logo-mark');
        const from = markRef.current.getBoundingClientRect();
        const to = target?.getBoundingClientRect();
        const flight = gsap.timeline({
          onComplete: () => {
            root.classList.remove('is-loading');
            unlock();
            markSeen();
            setVisible(false);
          },
        });
        if (to && to.width) {
          flight.to(markRef.current, {
            x: to.left + to.width / 2 - (from.left + from.width / 2),
            y: to.top + to.height / 2 - (from.top + from.height / 2),
            scale: to.width / from.width,
            duration: 0.7,
            ease: 'power3.inOut',
          });
        }
        flight.to(overlayRef.current, { backgroundColor: 'rgba(238, 240, 243, 0)', duration: 0.5, ease: 'power1.out' }, 0.15);
      });
    }, overlayRef);

    return () => {
      ctx.revert();
      root.classList.remove('is-loading');
      unlock();
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div ref={overlayRef} className="loader" aria-hidden="true">
      <div ref={markRef} className="loader__mark">
        <LogoMark />
      </div>
    </div>
  );
}
