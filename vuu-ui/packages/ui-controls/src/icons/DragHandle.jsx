import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;

// onClick is temporary until we have a proper Toolbar Field
const Icon = ({ onClick }) => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <rect class="icon-path" height="1" rx="0.375" width="1" x="6" y="2" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="6" y="5" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="6" y="8" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="6" y="11" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="6" y="14" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="9" y="2" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="9" y="5" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="9" y="8" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="9" y="11" />
    <rect class="icon-path" height="1" rx="0.375" width="1" x="9" y="14" />
      </svg>`;
  }, []);

  return <span className="Icon close" ref={root} onClick={onClick} />;
};

export default React.memo(Icon, neverRerender);
