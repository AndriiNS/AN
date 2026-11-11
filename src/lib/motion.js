import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const query = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(query).matches;
}

// true when the visitor asked the OS for less motion
export function useReducedMotion() {
  const [reduced, setReduced] = useState(prefersReducedMotion);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

let lenis = null;

export const getLenis = () => lenis;

//* -- Loader finished --
// Heavy work (starting the 3D scene) waits until the loader is gone, so it does not
// compete with the loader's animation. Resolved by Loader.jsx, also when it is skipped.
let resolveLoader;
export const loaderDone = new Promise((resolve) => {
  resolveLoader = resolve;
});
export const markLoaderDone = () => resolveLoader();

//* -- Interaction lock --
// While the loader or the page curtain is on screen, the visitor can't scroll,
// click, type or open the terminal: the page underneath is still getting ready.
// Each caller gets its own unlock function; the page is free again when all have unlocked.
let locks = 0;
const swallow = (e) => {
  e.preventDefault();
  e.stopPropagation();
};
const EVENTS = ['wheel', 'touchmove', 'keydown', 'mousedown', 'pointerdown', 'click', 'contextmenu'];

export const isLocked = () => locks > 0;

export function lockInteraction() {
  locks += 1;
  if (locks === 1) {
    EVENTS.forEach((type) => window.addEventListener(type, swallow, { capture: true, passive: false }));
    document.documentElement.classList.add('is-locked');
    document.activeElement?.blur?.();
    lenis?.stop();
  }
  let released = false;
  return function unlock() {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) {
      EVENTS.forEach((type) => window.removeEventListener(type, swallow, { capture: true }));
      document.documentElement.classList.remove('is-locked');
      lenis?.start();
    }
  };
}

// Smooth scroll (Lenis) driven by the GSAP ticker, so ScrollTrigger stays in sync
export function useSmoothScroll() {
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return undefined;
    lenis = new Lenis({ duration: 1.1 });
    if (isLocked()) lenis.stop();
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = null;
    };
  }, [reduced]);
}

// Scroll to a section by id, smoothly when Lenis is running
export function scrollToId(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: -72 });
  else el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

export { gsap, ScrollTrigger };
