import React, { useEffect, useRef } from 'react';

import './Icon.css';

const neverRerender = () => true;
const Icon = () => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `
    <svg height="100%" viewBox="0 0 18 18" width="100%">
    <path class="icon-path" d="M16,16H2V2H16Zm1,.5V1.5a.5.5,0,0,0-.5-.5H1.5a.5.5,0,0,0-.5.5v15a.5.5,0,0,0,.5.5h15A.5.5,0,0,0,17,16.5Z" />
    <rect class="icon-path" height="12" rx="0.25" width="4" x="3" y="3" />
      </svg>
  `;
  }, []);
  return <span className="Icon more-vertical" ref={root} />;
};
export default React.memo(Icon, neverRerender);
