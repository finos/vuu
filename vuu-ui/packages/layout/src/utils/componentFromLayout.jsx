import React from 'react';
import { ComponentRegistry } from '../registry/ComponentRegistry';

export default function componentFromLayout(layout) {
  // onsole.log(`%ccomponentFromLayout\n${JSON.stringify(layout,null,2)}`,'background-color:ivory;color:brown;')
  return _componentFromLayout(layout);
}

function _componentFromLayout(layoutModel) {
  // if (Array.isArray(layoutModel)) {
  //   return layoutModel.map(_componentFromLayout);
  // } else if (layoutModel == null) {
  //   return null;
  // }

  // does path work as well as id for key ?
  const { path, type, props, children: layoutChildren } = layoutModel;
  const [ReactType, reactBuiltIn] = getComponentType(type);
  let children =
    !layoutChildren || layoutChildren.length === 0
      ? null
      : layoutChildren.length === 1
      ? _componentFromLayout(layoutChildren[0])
      : layoutChildren.map(_componentFromLayout);

  return reactBuiltIn ? (
    <ReactType {...props} key={path}>
      {children}
    </ReactType>
  ) : (
    <ReactType {...props} key={path} layoutModel={layoutModel}>
      {children}
    </ReactType>
  );
}

function getComponentType(type) {
  if (ComponentRegistry[type]) {
    return [ComponentRegistry[type], false];
  } else if (type === type.toLowerCase()) {
    return [type, true];
  }
  throw Error('componentFromLayout: unknown component type: ' + type);
}
