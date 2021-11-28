import React, { forwardRef } from 'react';
import { registerComponent } from './registry/ComponentRegistry';

import './Component.css';

const Component = forwardRef(function Component(
  { id, resizeable, isChanged, style, name, ...props },
  ref
) {
  return <div {...props} className="Component" id={id} ref={ref} style={style} />;
});
Component.displayName = 'Component';

export default Component;

registerComponent('Component', Component);
