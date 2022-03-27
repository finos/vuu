import React from 'react';
import cx from 'classnames';

import './flipper.css';
export const Flipper = ({ children, flipped }) => {
  if (React.Children.count(children) !== 2) {
    throw Error('Flipper needs two children');
  }
  return (
    <div className={cx('hwFlipper', { ['hwFlipper-flipped']: flipped })}>
      <div className="hwFlipper-inner">{children}</div>
    </div>
  );
};
