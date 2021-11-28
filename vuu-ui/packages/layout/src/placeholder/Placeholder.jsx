import React from 'react';
import cx from 'classnames';
import { registerComponent } from '../registry/ComponentRegistry';

import './Placeholder.css';

const classBase = 'hwPlaceholder';

const Placeholder = ({ className, closeable, flexFill, resizeable, shim, ...props }) => {
  return (
    <div
      className={cx(classBase, className, {
        [`${classBase}-shim`]: shim
      })}
      {...props}
      data-placeholder
      data-resizeable
    />
  );
};

Placeholder.displayName = 'Placeholder';
export default Placeholder;
registerComponent('Placeholder', Placeholder);
