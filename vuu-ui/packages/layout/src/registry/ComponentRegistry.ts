import React, { FunctionComponent } from 'react';

const _containers: { [key: string]: boolean } = {};
const _views: { [key: string]: boolean } = {};

export type layoutComponentType = 'component' | 'container' | 'view';

export const ComponentRegistry: { [key: string]: FunctionComponent } = {};

export function isContainer(componentType: string) {
  return _containers[componentType] === true;
}

export function isView(componentType: string) {
  return _views[componentType] === true;
}

export const isLayoutComponent = (type: string) => isContainer(type) || isView(type);

export const isRegistered = (className: string) => !!ComponentRegistry[className];

// We could check and set displayName in here
export function registerComponent(
  componentName: string,
  component: FunctionComponent,
  type: layoutComponentType = 'component'
) {
  ComponentRegistry[componentName] = component;

  if (type === 'container') {
    _containers[componentName] = true;
  } else if (type === 'view') {
    _views[componentName] = true;
  }
}
