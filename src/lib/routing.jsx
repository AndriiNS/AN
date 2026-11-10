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
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef } from 'react';
import { useHref, useLocation, useNavigate } from 'react-router-dom';
import LogoMark from '../components/LogoMark';
import { gsap, getLenis, lockInteraction, prefersReducedMotion } from './motion';
import { logoIntro, resetLogo } from './logoIntro';
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

export function PageTransitions({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const curtainRef = useRef(null);
  const markRef = useRef(null);
  const busy = useRef(false);
  const unlockRef = useRef(null);

  // no scrolling or clicking while the curtain is up
  const lock = () => {
    unlockRef.current?.();
    unlockRef.current = lockInteraction();
  };
  const unlock = () => {
    unlockRef.current?.();
    unlockRef.current = null;
  };
  const ownNavigation = useRef(false);
  const lastPage = useRef(parsePath(location.pathname).page);

  const reveal = useCallback(() => {
    const curtain = curtainRef.current;
    gsap.to(curtain, {
      yPercent: -100,
      duration: 0.6,
      ease: 'power3.inOut',
      delay: 0.1,
      onComplete: () => {
        gsap.set(curtain, { visibility: 'hidden', yPercent: 100 });
        resetLogo(markRef.current.querySelector('svg'));
        busy.current = false;
        unlock();
      },
    });
  }, []);

  const go = useCallback(
    (to) => {
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
      const svg = markRef.current.querySelector('svg');
      gsap.set(curtain, { visibility: 'visible', yPercent: 100 });
      gsap
        .timeline()
        .to(curtain, { yPercent: 0, duration: 0.55, ease: 'power3.inOut' })
        .add(logoIntro(gsap, svg).timeScale(2.2), 0.15)
        .add(() => {
          navigate(to);
          scrollTop();
          // give the new page one frame to lay out, then lift the curtain
          requestAnimationFrame(() => requestAnimationFrame(reveal));
        });
    },
    [location.pathname, location.search, navigate, reveal],
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
    gsap.set(curtainRef.current, { visibility: 'visible', yPercent: 0 });
    reveal();
  }, [location.pathname, reveal]);

  useEffect(() => {
    gsap.set(curtainRef.current, { visibility: 'hidden', yPercent: 100 });
    return () => unlockRef.current?.();
  }, []);

  return (
    <TransitionContext.Provider value={{ go }}>
      {children}
      <div ref={curtainRef} className="curtain" aria-hidden="true">
        <div ref={markRef} className="curtain__mark">
          <LogoMark className="logo-mark--on-dark" />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
