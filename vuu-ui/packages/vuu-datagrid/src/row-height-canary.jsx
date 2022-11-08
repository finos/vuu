import React from 'react';
import { useRowHeight } from './use-row-height';
import './row-height-canary.css';

export const RowHeightCanary = () => {
  const rowHeightCanary = useRowHeight();
  return <div className="Grid-rowHeightCanary" ref={rowHeightCanary} />;
};
