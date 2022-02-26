import React from 'react';
import cx from 'classnames';

import './pillbox.css';

export const Pillbox = ({ children, className, ...htmlAttributes }) => {
  return (
    <div className={cx('hwPillbox', className)} {...htmlAttributes}>
      {children}
    </div>
  );
};
