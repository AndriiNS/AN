// The AN monogram ("shared stem"): the right leg of the A is also the first
// stem of the N. That shared stem is yellow, like a text cursor.
//
// Every part is a filled shape cut flat at the cap line (y 12) and the baseline (y 88),
// in a 100 × 100 box. The A's leg and the N's diagonal are placed so their outer
// edges meet the yellow stem (x 34.5–45.5) exactly at the top, and are trimmed where
// they pass under it, so no dark pixels peek out beside the stem.
// Parts are separate elements, so the loader can grow, move or turn each one.

export const LOGO_PARTS = {
  // A, left leg: from the foot (4–16) up to the stem
  leg: '4.5,88 16.32,88 45.5,14.08 45.5,12 34.5,12',
  // N, diagonal: from the stem down to the right foot
  diagonal: '34.5,14.6 34.5,12 45.5,12 83.5,88 71.2,88',
};

export default function LogoMark({ className = '', title }) {
  return (
    <svg
      className={`logo-mark ${className}`}
      viewBox="0 0 100 100"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      <polygon className="logo-mark__leg" points={LOGO_PARTS.leg} />
      <rect className="logo-mark__bar" x="18.06" y="56.5" width="21.94" height="11" />
      <polygon className="logo-mark__diagonal" points={LOGO_PARTS.diagonal} />
      <rect className="logo-mark__stem" x="72.5" y="12" width="11" height="76" />
      <rect className="logo-mark__cursor" x="34.5" y="12" width="11" height="76" />
    </svg>
  );
}
