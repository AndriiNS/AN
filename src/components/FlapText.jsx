// Text that changes like a split-flap departure board (the old boards at
// train stations): when the text changes, every letter flips through a few
// random letters and lands on the new one, from left to right.
//
// The real text is kept in a visually hidden span for screen readers and SEO;
// the flipping letters are only decoration (aria-hidden).
import { Fragment, useLayoutEffect, useRef } from 'react';
import { gsap, useReducedMotion } from '../lib/motion';

const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const CYRILLIC = 'АБВГҐДЕЄЖЗИІЇКЛМНОПРСТУФХЦЧШЩЬЮЯабвгдеєжзиіїклмнопрстуфхцчшщьюя';

function randomGlyph(target) {
  const pool = /[А-яЄєІіЇїҐґ]/.test(target) ? CYRILLIC : LATIN;
  return pool[Math.floor(Math.random() * pool.length)];
}

export default function FlapText({ text, as: Tag = 'span', className = '', ...rest }) {
  const rootRef = useRef(null);
  const prevText = useRef(text);
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    if (prevText.current === text) return undefined;
    prevText.current = text;
    if (reduced) return undefined;

    const chars = rootRef.current.querySelectorAll('.flap__char');
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      chars.forEach((el, i) => {
        const final = el.textContent;
        if (final.trim() === '') return;
        const flips = 2 + Math.floor(Math.random() * 3);
        const start = i * 0.018;
        for (let f = 0; f <= flips; f++) {
          const glyph = f === flips ? final : randomGlyph(final);
          const at = start + f * 0.075;
          // top half falls down, letter changes, bottom half comes up
          tl.to(el, { rotationX: 90, duration: 0.035, ease: 'none' }, at)
            .call(() => {
              el.textContent = glyph;
            }, null, at + 0.035)
            .fromTo(el, { rotationX: -90 }, { rotationX: 0, duration: 0.04, ease: 'none' }, at + 0.035);
        }
      });
    }, rootRef);

    return () => ctx.revert();
  }, [text, reduced]);

  const words = text.split(' ');

  return (
    <Tag ref={rootRef} className={`flap ${className}`} {...rest}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) => (
          <Fragment key={`${text}-${w}`}>
            {w > 0 && ' '}
            <span className="flap__word">
              {[...word].map((ch, c) => (
                <span key={c} className="flap__char">
                  {ch}
                </span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  );
}
