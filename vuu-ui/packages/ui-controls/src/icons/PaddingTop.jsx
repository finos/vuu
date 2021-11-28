import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;
const Icon = () => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <path class="icon-path" d="M2,15.5V1.5H16v14ZM17,16V1a.5.5,0,0,0-.5-.5H1.5A.5.5,0,0,0,1,1V16a.5.5,0,0,0,.5.5h15A.5.5,0,0,0,17,16Z" />
    <rect class="icon-path" height="4" rx="0.25" width="12" x="3" y="2.5" />
      </svg>
  `;
  }, []);
  return <span className="Icon more-vertical" ref={root} />;
};

export default React.memo(Icon, neverRerender);
