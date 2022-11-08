import classnames from 'classnames';
import React, { useRef } from 'react';
import { registerComponent } from './registry/ComponentRegistry';

import './DraggableLayout.css';

// We need to add props to restrict drag behaviour to, for example, popups only
export const DraggableLayout = function DraggableLayout(props) {
  // We shouldn't need this but somewhere the customDispatcher/handleDragStart callback is not
  // being updated and preserves stale ref to props.children, so DragDrop from within a nested
  // LatoutContext (Stack or DraggableLayout) fails.
  const sourceRef = useRef();
  sourceRef.current = props;

  const { className: classNameProp, id, style } = props;

  const className = classnames('DraggableLayout', classNameProp);
  return (
    <div className={className} id={id} style={style}>
      {props.children}
    </div>
  );
};

const componentName = 'DraggableLayout';

DraggableLayout.displayName = componentName;

registerComponent(componentName, DraggableLayout, 'container');
