import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;
const Icon = () => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <path class="icon-path" d="M2,1.5H16v14H2Zm-.5,15h15A.5.5,0,0,0,17,16V1a.5.5,0,0,0-.5-.5H1.5A.5.5,0,0,0,1,1V16A.5.5,0,0,0,1.5,16.5Z" />
    <rect class="icon-path" height="12" rx="0.25" width="4" x="11" y="2.5" />
      </svg>
  `;
  }, []);
  return <span className="Icon more-vertical" ref={root} />;
};

export default React.memo(Icon, neverRerender);
