// Wraps a block so that hovering or focusing it shows a DevTools-style highlight:
// tinted box plus a label with the selector and the real size in pixels.
import { useRef, useState } from 'react';

export default function Inspectable({ as: Tag = 'div', selector, className = '', children, ...rest }) {
  const ref = useRef(null);
  const [size, setSize] = useState(null);

  const show = () => {
    const r = ref.current.getBoundingClientRect();
    setSize(`${Math.round(r.width)} × ${Math.round(r.height)}`);
  };
  const hide = (e) => {
    if (e.type === 'blur' && ref.current.contains(e.relatedTarget)) return;
    setSize(null);
  };

  return (
    <Tag
      ref={ref}
      className={`inspectable ${size ? 'is-inspected' : ''} ${className}`}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
      {...rest}
    >
      {children}
      <span className="inspectable__label" aria-hidden="true">
        <span className="inspectable__selector">{selector}</span>
        {size && <span className="inspectable__size">{size}</span>}
      </span>
    </Tag>
  );
}
