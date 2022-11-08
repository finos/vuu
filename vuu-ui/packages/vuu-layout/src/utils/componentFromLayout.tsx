import React from 'react';
import { LayoutJSON } from '../layout-reducer';
import { ComponentRegistry } from '../registry/ComponentRegistry';

export function componentFromLayout(layoutModel: LayoutJSON) {

  const { id, type, props, children: layoutChildren } = layoutModel;
  const ReactType = getComponentType(type);
  let children =
    !layoutChildren || layoutChildren.length === 0
      ? null
      : layoutChildren.length === 1
      ? componentFromLayout(layoutChildren[0])
      : layoutChildren.map(componentFromLayout);

  return (
    <ReactType {...props} key={id}>
      {children}
    </ReactType>
  );
}

// support for built-in react ttpes (div etc) removed here
function getComponentType(type: string) {
  const reactType = ComponentRegistry[type];
  if (reactType === undefined){
    throw Error('componentFromLayout: unknown component type: ' + type);
  }
  return reactType;
}
