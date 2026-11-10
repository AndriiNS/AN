// Loader intro "Growth": the strokes of the AN mark grow up from the baseline
// like bars of a chart, one after another with a little spring. The yellow
// stem grows last, jumps higher than the rest and settles back to its height.
//
// SVG parts are transformed by hand (we write the transform attribute) rather
// than with GSAP's svgOrigin, which drifts when a scale starts at 0.

// state of one part: offset, rotation, scale around an origin (ox, oy), opacity
const REST = { x: 0, y: 0, rot: 0, sx: 1, sy: 1, o: 1 };

function apply(el) {
  const t = el.__t;
  if (!t) return; // already reset (e.g. the loader is being removed)
  el.setAttribute(
    'transform',
    `translate(${t.x} ${t.y}) translate(${t.ox} ${t.oy}) rotate(${t.rot}) scale(${t.sx} ${t.sy}) translate(${-t.ox} ${-t.oy})`,
  );
  el.setAttribute('opacity', t.o);
}

// put a part into a state right away, around origin (ox, oy) in logo units
function init(el, ox, oy, state = {}) {
  el.__t = { ...REST, ox, oy, ...state };
  apply(el);
}

// tween a part from its current state to `to` (missing keys go to the resting state)
function tween(gsap, tl, el, to, vars, position) {
  tl.to(el.__t, { ...REST, ...to, ...vars, onUpdate: () => apply(el) }, position);
}

// remove the inline transforms, so the mark is plain again
export function resetLogo(svg) {
  svg.querySelectorAll('[class^="logo-mark__"]').forEach((el) => {
    el.removeAttribute('transform');
    el.removeAttribute('opacity');
    delete el.__t;
  });
}

export function logoIntro(gsap, svg) {
  const part = (name) => svg.querySelector(`.logo-mark__${name}`);
  const strokes = ['leg', 'diagonal', 'stem'].map(part);
  const bar = part('bar');
  const cursor = part('cursor');

  // everything starts flat on the baseline (y 88); the bar starts at its left end
  strokes.forEach((el) => init(el, 50, 88, { sy: 0.001 }));
  init(bar, 18, 62, { sx: 0.001 });
  init(cursor, 40, 88, { sy: 0.001 });

  const tl = gsap.timeline({ delay: 0.15 });
  strokes.forEach((el, i) => tween(gsap, tl, el, {}, { duration: 0.6, ease: 'elastic.out(1, 0.55)' }, i * 0.12));
  tween(gsap, tl, bar, {}, { duration: 0.3, ease: 'power3.out' }, 0.45);
  // the yellow stem overshoots to 122 % of its height, then springs back
  tween(gsap, tl, cursor, { sy: 1.22 }, { duration: 0.35, ease: 'power3.out' }, 0.6);
  tween(gsap, tl, cursor, {}, { duration: 0.6, ease: 'elastic.out(1, 0.35)' });
  return tl;
}
