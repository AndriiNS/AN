// Dotted map of Europe with the route Khmelnytskyi -> Kyiv -> Hagen.
// The route draws itself while the visitor scrolls through the timeline.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import FlapText from './FlapText';
import map from '../data/europe-map.json';
import { ScrollTrigger, useReducedMotion } from '../lib/motion';

const [kx, ky] = map.cities.khmelnytskyi;
const [vx, vy] = map.cities.kyiv;
const [hx, hy] = map.cities.hagen;

// two arcs: a short hop east to Kyiv, then a long curve west to Hagen
const LEG_1 = `M ${kx} ${ky} Q ${(kx + vx) / 2} ${Math.min(ky, vy) - 40} ${vx} ${vy}`;
const LEG_2 = `Q ${(vx + hx) / 2} ${Math.min(vy, hy) - 170} ${hx} ${hy}`;
const ROUTE = `${LEG_1} ${LEG_2}`;

// label offsets so names do not sit on the route
const CITIES = [
  { id: 'khmelnytskyi', x: kx, y: ky, lx: -14, ly: 30, anchor: 'end' },
  { id: 'kyiv', x: vx, y: vy, lx: 14, ly: -14, anchor: 'start' },
  { id: 'hagen', x: hx, y: hy, lx: -14, ly: -16, anchor: 'end' },
];

function DotMap() {
  // one path per color is much lighter for the browser than 3500 <circle> elements
  const paths = useMemo(() => {
    const r = 2.6;
    const byType = { '': [], ua: [], de: [] };
    for (const [x, y, type] of map.dots) byType[type].push(`M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`);
    return Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, v.join('')]));
  }, []);
  return (
    <g>
      <path d={paths['']} className="map__dots" />
      <path d={paths.ua} className="map__dots map__dots--ua" />
      <path d={paths.de} className="map__dots map__dots--de" />
    </g>
  );
}

export default function Journey() {
  const { t } = useTranslation();
  const items = t('journey.items', { returnObjects: true });
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const routeRef = useRef(null);
  const travellerRef = useRef(null);
  const [step, setStep] = useState(reduced ? items.length - 1 : 0);
  const [reached, setReached] = useState(reduced ? 1 : 0); // how far along the route, 0..1

  // where Kyiv sits along the whole route (0..1)
  const kyivAt = useMemo(() => {
    const ns = 'http://www.w3.org/2000/svg';
    const full = document.createElementNS(ns, 'path');
    const leg = document.createElementNS(ns, 'path');
    full.setAttribute('d', ROUTE);
    leg.setAttribute('d', LEG_1);
    return leg.getTotalLength() / full.getTotalLength();
  }, []);
  const cityAt = { khmelnytskyi: 0, kyiv: kyivAt, hagen: 0.999 };

  useEffect(() => {
    const path = routeRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;

    const draw = (p) => {
      path.style.strokeDashoffset = `${length * (1 - p)}`;
      const pt = path.getPointAtLength(length * p);
      travellerRef.current.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      // re-render only when a city is reached, not on every scroll frame
      setReached(p >= 0.999 ? 1 : p >= kyivAt ? kyivAt : 0);
    };

    if (reduced) {
      draw(1);
      setStep(items.length - 1);
      return undefined;
    }

    // The route is complete when the last milestone reaches the middle of the screen.
    // The timeline has extra space after it (see _journey.scss), so the map stays
    // pinned for a while and Hagen can light up while the visitor is still looking.
    const timeline = sectionRef.current.querySelector('.journey__timeline');
    const st = ScrollTrigger.create({
      trigger: timeline,
      start: 'top 60%',
      endTrigger: timeline.lastElementChild,
      end: 'top 45%',
      onUpdate: (self) => {
        draw(self.progress);
        setStep(Math.min(items.length - 1, Math.floor(self.progress * items.length)));
      },
    });
    draw(st.progress);
    return () => st.kill();
  }, [reduced, items.length, kyivAt]);

  return (
    <section ref={sectionRef} className="section journey" id="journey" aria-labelledby="journey-title">
      <div className="section__head">
        <FlapText as="h2" id="journey-title" className="section__title" text={t('journey.title')} />
        <p className="section__intro">{t('journey.intro')}</p>
      </div>

      <div className="journey__grid">
        <div className="journey__map">
          <svg viewBox={`0 0 ${map.width} ${map.height}`} className="map" role="img" aria-label={t('journey.title')}>
            <DotMap />
            <path d={ROUTE} className="map__route-ghost" />
            <path ref={routeRef} d={ROUTE} className="map__route" />
            {CITIES.map((c) => (
              <g
                key={c.id}
                className={`map__city map__city--${c.id} ${reached >= cityAt[c.id] ? 'is-on' : ''}`}
                transform={`translate(${c.x} ${c.y})`}
              >
                {/* Hagen, the end of the route, gets a pulsing ring once it is reached */}
                {c.id === 'hagen' && <circle r="8" className="map__pulse" />}
                <circle r="8" />
                <text x={c.lx} y={c.ly} textAnchor={c.anchor}>
                  {t(`journey.cities.${c.id}`)}
                </text>
              </g>
            ))}
            <circle ref={travellerRef} r="6" className="map__traveller" />
          </svg>
          <p className={`journey__arrived ${reached >= 0.999 ? 'is-on' : ''}`} aria-live="polite">
            {t('journey.arrived')}
          </p>
        </div>

        <ol className="journey__timeline">
          {items.map((item, i) => (
            <li key={item.date} className={`milestone ${i <= step ? 'is-reached' : ''}`}>
              <p className="milestone__date">{item.date}</p>
              <h3 className="milestone__title">{item.title}</h3>
              <p className="milestone__place">{item.place}</p>
              <p className="milestone__text">{item.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
