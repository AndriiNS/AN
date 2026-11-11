// The AN mark built from HTML boxes instead of SVG, for the loader and the page curtain.
//
// Why not the SVG: its parts can only be moved with the `transform` attribute, which the
// browser recalculates on the main thread. While the page is still loading (or a new page
// is being built behind the curtain) the main thread is busy, so that animation stuttered.
// Here every part is a box cut into shape with clip-path, and only its CSS `transform`
// is animated by CSS keyframes. The browser hands those to the compositor, so they stay
// smooth even when JavaScript is busy. The keyframes live in styles/_base.scss.
//
// speed: 1 = the loader, 2.2 = the quicker version in the page curtain.

const PARTS = ['leg', 'bar', 'diagonal', 'stem', 'cursor'];

export default function GrowMark({ className = '', speed = 1, waiting = false }) {
  return (
    <div
      className={`grow-mark ${waiting ? 'is-waiting' : ''} ${className}`}
      style={{ '--grow-time': 1 / speed }}
      aria-hidden="true"
    >
      {PARTS.map((part) => (
        <span key={part} className={`grow-mark__part grow-mark__${part}`} />
      ))}
    </div>
  );
}
