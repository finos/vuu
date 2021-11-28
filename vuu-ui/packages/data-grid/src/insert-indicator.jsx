import React, { forwardRef } from 'react';

import './insert-indicator.css';

const InsertIndicator = forwardRef(function InsertIndicator(props, ref) {
  return <div className={'InsertIndicator'} ref={ref} />;
});

export default InsertIndicator;
