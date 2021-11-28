/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef } from 'react';
import cx from 'classnames';

import './Icon.css';

export const neverRerender = () => true;

const SvgIcon = ({ size = 18, svgPath, className, ...props }) => {
  const root = useRef(null);
  useEffect(() => {
    root.current.innerHTML = `<svg height="100%" viewBox="0 0 ${size} ${size}" width="100%">${svgPath}</svg>`;
  }, []);
  return <span className={cx(className, 'hwIcon')} ref={root} {...props} />;
};

export default SvgIcon;
