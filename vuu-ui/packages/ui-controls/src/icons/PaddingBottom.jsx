import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;
const Icon = () => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <path class="icon-path" d="M16,2V16H2V2Zm.5-1H1.5a.5.5,0,0,0-.5.5v15a.5.5,0,0,0,.5.5h15a.5.5,0,0,0,.5-.5V1.5A.5.5,0,0,0,16.5,1Z" />
    <rect class="icon-path" height="4" rx="0.25" width="12" x="3" y="11" />
    </svg>
  `;
  }, []);
  return <span className="Icon more-vertical" ref={root} />;
};

export default React.memo(Icon, neverRerender);
