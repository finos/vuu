const _containers = {};
const _views = {};

export const ComponentRegistry = {};

export function isContainer(componentType) {
  return _containers[componentType] === true;
}

export function isView(componentType) {
  return _views[componentType] === true;
}

export const isLayoutComponent = (type) => isContainer(type) || isView(type);

export const isRegistered = (className) => !!ComponentRegistry[className];

// We could check and set displayName in here
export function registerComponent(componentName, component, type = 'component') {
  ComponentRegistry[componentName] = component;

  if (type === 'container') {
    _containers[componentName] = true;
  } else if (type === 'view') {
    _views[componentName] = true;
  }
}

// const EMPTY_OBJECT = {};

// export function getDefaultProps({ type }) {
//   if (typeof type === "function" && type.prototype.isReactComponent) {
//     return type.defaultProps;
//   }
//   return EMPTY_OBJECT;
// }
