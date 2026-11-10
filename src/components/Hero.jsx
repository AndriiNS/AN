import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import { CV } from '../data/site';
import { gsap, ScrollTrigger, scrollToId, useReducedMotion } from '../lib/motion';

// three.js is big, so the 3D scene loads after the text is already on screen
const HeroScene = lazy(() => import('../scenes/HeroScene'));

// where each stage starts on the 0..1 scroll progress (see HeroScene.jsx)
const STAGE_STARTS = [0.05, 0.34, 0.64];

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    // free the test context right away, browsers allow only a few at a time
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

export default function Hero() {
  const { t, i18n } = useTranslation();
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const introRef = useRef(null);
  const barsRef = useRef([]);
  const progressRef = useRef(0); // 0..1 while the hero scrolls, read by the 3D scene
  const [stage, setStage] = useState(-1); // -1: intro text, 0..2: Build, Automate, Ship
  const [active, setActive] = useState(true);
  const [webgl] = useState(hasWebGL);
  const stages = t('hero.stages', { returnObjects: true });

  useEffect(() => {
    if (reduced) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: ({ progress }) => {
          progressRef.current = progress;
          // fill the three progress bars
          barsRef.current.forEach((bar, i) => {
            const from = STAGE_STARTS[i];
            const to = STAGE_STARTS[i + 1] ?? 1;
            bar.style.transform = `scaleX(${gsap.utils.clamp(0, 1, (progress - from) / (to - from))})`;
          });
          let next = -1;
          STAGE_STARTS.forEach((s, i) => {
            if (progress >= s) next = i;
          });
          setStage((prev) => (prev === next ? prev : next));
        },
      });

      // the intro steps back as soon as the page starts coming apart
      gsap.to(introRef.current, {
        autoAlpha: 0,
        y: -40,
        ease: 'none',
        scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '8% top', scrub: true },
      });
    }, sectionRef);

    // stop rendering 3D when the hero is off screen
    const io = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    io.observe(sectionRef.current);

    return () => {
      ctx.revert();
      io.disconnect();
    };
  }, [reduced]);

  return (
    <section ref={sectionRef} className={`hero ${reduced ? 'hero--static' : ''}`} id="top" aria-labelledby="hero-name">
      <div className="hero__stage">
        {webgl && (
          <div className="hero__canvas">
            <Suspense fallback={null}>
              <HeroScene progressRef={progressRef} reduced={reduced} active={active} />
            </Suspense>
          </div>
        )}

        <div className="hero__inner">
          <div ref={introRef} className="hero__intro">
            <p className="hero__role">{t('hero.role')}</p>
            <FlapText as="h1" id="hero-name" className="hero__name" text={t('hero.name')} />
            <FlapText as="p" className="hero__tagline" text={t('hero.tagline')} />
            <div className="hero__actions">
              <a
                className="btn btn--primary"
                href="#projects"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToId('projects');
                }}
              >
                {t('hero.ctaProjects')}
              </a>
              <a className="btn" href={`${import.meta.env.BASE_URL}${CV[i18n.language]}`} download>
                {t('hero.ctaCv')}
              </a>
            </div>
          </div>

          {/* one caption per stage, shown while that stage plays */}
          {!reduced && (
            <div className="hero__captions" aria-live="polite">
              {stages.map((s, i) => (
                <div key={i} className={`hero__caption ${stage === i ? 'is-active' : ''}`} aria-hidden={stage !== i}>
                  <p className="hero__caption-name">{s.name}</p>
                  <p className="hero__caption-text">{s.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {!reduced && (
          <ol className="hero__steps" aria-label={t('hero.stagesLabel')}>
            {stages.map((s, i) => (
              <li key={i} className={stage >= i ? 'is-on' : ''}>
                <span className="hero__step-name">{s.name}</span>
                <span className="hero__step-track">
                  <span
                    className="hero__step-bar"
                    ref={(el) => {
                      barsRef.current[i] = el;
                    }}
                  />
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
