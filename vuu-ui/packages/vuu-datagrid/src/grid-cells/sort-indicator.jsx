import React from 'react';
import cx from 'classnames';

import './sort-indicator.css';

export const Direction = {
  ASC: 'asc',
  DSC: 'dsc'
};

export const SortIndicator = ({ sorted }) => {
  if (!sorted) {
    return null;
  }

  const direction =
    typeof sorted === 'number' ? (sorted < 0 ? Direction.DSC : Direction.ASC) : sorted;

  return typeof sorted === 'number' ? (
    <div
      className={cx('hwSortIndicator', 'multi-col', direction)}
      data-icon={`sorted-${direction}`}
    >
      <span className="hwIconContainer" />
      <span className={'hwSortPosition'}>{Math.abs(sorted)}</span>
    </div>
  ) : (
    <div className={cx('hwSortIndicator', 'single-col')} data-icon={`sorted-${direction}`}>
      <span className="hwIconContainer" />
    </div>
  );
};
