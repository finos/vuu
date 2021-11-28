import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;
const Icon = () => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <circle class="icon-path" cx="9" cy="9" r="2.05" />
    <circle class="icon-path" cx="9" cy="3" r="2.05" />
    <circle class="icon-path" cx="9" cy="15" r="2.05" />
  </svg>
  `;
  }, []);
  return <span className="Icon more-vertical" ref={root} />;
};

export default React.memo(Icon, neverRerender);
