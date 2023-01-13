import classnames from 'classnames';
import { useRef } from 'react';
import { registerComponent } from './registry/ComponentRegistry';

import './DraggableLayout.css';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const DraggableLayout = function DraggableLayout(props: any) {
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
