import React, { useRef } from 'react';
import classnames from 'classnames';
import useActivationIndicator from './useActivationIndicator';

import './ActivationIndicator.css';

const ActivationIndicator = ({
  hideBackground = false,
  hideThumb = false,
  orientation = 'horizontal',
  tabRef
}) => {
  const rootRef = useRef(null);
  const rootClass = 'hwActivationIndicator';
  const style = useActivationIndicator(rootRef, tabRef, orientation);

  return (
    <div
      className={classnames(rootClass, `${rootClass}-${orientation}`, {
        [`${rootClass}-no-background`]: hideBackground
      })}
      ref={rootRef}>
      {hideThumb === false ? <div className={`${rootClass}-thumb`} style={style} /> : null}
    </div>
  );
};

export default ActivationIndicator;
