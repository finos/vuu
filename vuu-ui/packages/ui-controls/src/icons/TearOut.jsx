import React from 'react';
import classnames from 'classnames';

const TearOut = ({ className, ...props }) => (
  <button
    {...props}
    className={classnames('TearOutButton', className)}
    title="TearOut View"
    variant="secondary"
  ></button>
);

export default TearOut;
