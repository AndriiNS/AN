// Routing helpers and page transitions.
//
// useRoute()      -> { lang, page } for the current URL
// <TransitionLink> a link that plays the page transition
// <PageTransitions> wraps the app and draws the curtain:
//   - the curtain (dark, with the logo growing in it) slides up over the page,
//   - the new page is rendered and scrolled to the top underneath,
//   - the curtain slides away upwards.
// Switching language keeps you on the same page, so it never shows the curtain
// (headings flip instead). Browser back/forward to another page plays the second half.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHref, useLocation, useNavigate } from 'react-router-dom';
import GrowMark from '../components/GrowMark';
import { getLenis, lockInteraction, prefersReducedMotion } from './motion';
import { parsePath } from './lang';

export function useRoute() {
  const { pathname } = useLocation();
  return parsePath(pathname);
}

const TransitionContext = createContext({ go: () => {} });

export function useTransitionNavigate() {
  return useContext(TransitionContext).go;
}

export function TransitionLink({ to, children, onClick, ...rest }) {
  const href = useHref(to);
  const go = useTransitionNavigate();
  return (
    <a
      href={href}
      onClick={(e) => {
        onClick?.(e);
        // let the browser handle new tabs, middle clicks and so on
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

function scrollTop() {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  window.scrollTo(0, 0);
}

const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function PageTransitions({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const curtainRef = useRef(null);
  const busy = useRef(false);
  const unlockRef = useRef(null);
  const ownNavigation = useRef(false);
  const lastPage = useRef(parsePath(location.pathname).page);
  // changing the key mounts a fresh mark, which plays its growth animation again
  const [markRun, setMarkRun] = useState(0);

  // no scrolling or clicking while the curtain is up
  const lock = () => {
    unlockRef.current?.();
    unlockRef.current = lockInteraction();
  };
  const unlock = () => {
    unlockRef.current?.();
    unlockRef.current = null;
  };

  // The curtain moves with the Web Animations API (transform only), so the browser runs it
  // off the main thread: smooth on phones too, even while the next page is being built.
  const slide = (from, to, options) =>
    curtainRef.current.animate([{ transform: `translateY(${from})` }, { transform: `translateY(${to})` }], {
      easing: EASE,
      fill: 'forwards',
      ...options,
    });

  const reveal = useCallback(async () => {
    const curtain = curtainRef.current;
    await slide('0%', '-100%', { duration: 600, delay: 100 }).finished.catch(() => {});
    curtain.getAnimations().forEach((a) => a.cancel());
    curtain.style.visibility = 'hidden';
    busy.current = false;
    unlock();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback(
    async (to) => {
      const current = `${location.pathname}${location.search}`;
      if (to === current || busy.current) return;
      const samePage = parsePath(to).page === parsePath(location.pathname).page;
      if (prefersReducedMotion() || samePage) {
        navigate(to);
        if (!samePage) scrollTop();
        return;
      }
      busy.current = true;
      ownNavigation.current = true;
      lock();
      const curtain = curtainRef.current;
      curtain.getAnimations().forEach((a) => a.cancel());
      curtain.style.visibility = 'visible';
      setMarkRun((n) => n + 1);
      // cover the page, and let the logo grow for a moment
      await Promise.all([slide('100%', '0%', { duration: 550 }).finished.catch(() => {}), wait(850)]);
      navigate(to);
      scrollTop();
      // give the new page one frame to lay out, then lift the curtain
      requestAnimationFrame(() => requestAnimationFrame(reveal));
    },
    [location.pathname, location.search, navigate, reveal], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // back/forward buttons: the page already changed, so show the second half
  useLayoutEffect(() => {
    const page = parsePath(location.pathname).page;
    const changed = page !== lastPage.current;
    lastPage.current = page;
    if (ownNavigation.current) {
      ownNavigation.current = false;
      return;
    }
    if (!changed) return;
    scrollTop();
    if (prefersReducedMotion()) return;
    busy.current = true;
    lock();
    const curtain = curtainRef.current;
    curtain.getAnimations().forEach((a) => a.cancel());
    curtain.style.visibility = 'visible';
    curtain.style.transform = 'translateY(0)';
    reveal().then(() => {
      curtain.style.transform = '';
    });
  }, [location.pathname, reveal]);

  useEffect(() => () => unlockRef.current?.(), []);

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <div ref={curtainRef} className="curtain" aria-hidden="true">
        <div className="curtain__mark">{markRun > 0 && <GrowMark key={markRun} speed={2.2} className="grow-mark--on-dark" />}</div>
      </div>
    </TransitionContext.Provider>
  );
}
