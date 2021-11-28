import React from 'react';
import { isContainer } from '../registry/ComponentRegistry';
import { typeOf } from './typeOf';
import { getProp, getProps } from './propUtils';

// TODO isn't this equivalent to containerOf ?
export function followPathToParent(source, path) {
  const { 'data-path': dataPath, path: sourcePath = dataPath } = getProps(source);

  if (path === '0') return null;
  if (path === sourcePath) return null;

  return followPath(source, path.replace(/.\d+$/, ''));
}

export function findTarget(source, test) {
  const { children, ...props } = getProps(source);
  if (test(props)) {
    return source;
  } else if (React.Children.count(children) > 0) {
    const array = React.isValidElement(children) ? [children] : children;
    for (let child of array) {
      const target = findTarget(child, test);
      if (target) {
        return target;
      }
    }
  }
}

export function lastChild(source, target) {
  const container = followPath(source, target);
  let isElement = React.isValidElement(container);
  const children = isElement
    ? React.isValidElement(container.props.children)
      ? [container.props.children]
      : container.props.children
    : container.children;
  return children && children[children.length - 1];
}

export function containerOf(source, target) {
  if (target === source) {
    return null;
  } else {
    const { path: sourcePath, children } = getProps(source);

    let { idx, finalStep } = nextStep(sourcePath, getProp(target, 'path'));
    if (finalStep) {
      return source;
    } else if (children === undefined || children[idx] === undefined) {
      return null;
    } else {
      return containerOf(children[idx], target);
    }
  }
}

// Do not use React.Children.toArray,
// it does not preserve keys
export const getChild = (children, idx) => {
  // idx may be a nu,mber or string
  if (React.isValidElement(children) && idx == 0) {
    return children;
  } else if (Array.isArray(children)) {
    return children[idx];
  }
};

// Use a path only to identify a component
export function followPathToComponent(component, path) {
  var paths = path.split('.');
  let children = [component];

  const getChildren = (c) =>
    React.isValidElement(c.props.children) ? [c.props.children] : c.props.children;

  for (let i = 0; i < paths.length; i++) {
    const idx = parseInt(paths[i]);
    const child = children[idx];
    if (i === paths.length - 1) {
      return child;
    } else {
      children = getChildren(child);
    }
  }
}

export function followPath(source, path) {
  const { 'data-path': dataPath, path: sourcePath = dataPath } = getProps(source);
  if (path.indexOf(sourcePath) !== 0) {
    throw Error(`pathUtils.followPath path ${path} is not within model.path ${sourcePath}`);
  }

  var route = path.slice(sourcePath.length + 1);
  if (route === '') {
    return source;
  }
  var paths = route.split('.');

  let isElement = React.isValidElement(source);
  for (var i = 0; i < paths.length; i++) {
    if (
      (isElement && React.Children.count(source.props.children) === 0) ||
      (!isElement && source.children === undefined)
    ) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join('.')} has no children, so cannot fulfill rest of path ${paths.slice(i).join('.')}`
      );
      return;
    }

    source = getChild(isElement ? source.props.children : source.children, paths[i]);
    isElement = React.isValidElement(source);

    if (source === undefined) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join('.')} has no children that fulfill next step of path ${paths.slice(i).join('.')}`
      );
      return;
    }
  }
  return source;
}

export function nextLeaf(root, path) {
  const parent = followPathToParent(root, path);
  let pathIndices = path.split('.').map((idx) => parseInt(idx, 10));
  const lastIdx = pathIndices.pop();
  const { children } = parent.props;
  if (children.length - 1 > lastIdx) {
    return firstLeaf(children[lastIdx + 1]);
  } else {
    const parentIdx = pathIndices.pop();
    const nextParent = followPathToParent(root, getProp(parent, 'path'));
    pathIndices = nextParent.props.path.split('.').map((idx) => parseInt(idx, 10));
    if (nextParent.props.children.length - 1 > parentIdx) {
      const nextStep = nextParent.props.children[parentIdx + 1];
      if (isContainer(typeOf(nextStep))) {
        return firstLeaf(nextStep);
      } else {
        return nextStep;
      }
    }
  }

  return firstLeaf(root);
}

export function previousLeaf(root, path) {
  let pathIndices = path.split('.').map((idx) => parseInt(idx, 10));
  let lastIdx = pathIndices.pop();
  let parent = followPathToParent(root, path);
  const { children } = parent.props;
  if (lastIdx > 0) {
    return lastLeaf(children[lastIdx - 1]);
  } else {
    while (pathIndices.length > 1) {
      lastIdx = pathIndices.pop();
      parent = followPathToParent(root, getProp(parent, 'path'));
      // pathIndices = nextParent.props.path
      //   .split(".")
      //   .map((idx) => parseInt(idx, 10));
      if (lastIdx > 0) {
        const nextStep = parent.props.children[lastIdx - 1];
        if (isContainer(typeOf(nextStep))) {
          return lastLeaf(nextStep);
        } else {
          return nextStep;
        }
      }
    }
  }

  return lastLeaf(root);
}

function firstLeaf(root) {
  if (isContainer(typeOf(root))) {
    const { children } = root.props || root;
    return firstLeaf(children[0]);
  } else {
    return root;
  }
}

function lastLeaf(root) {
  if (isContainer(typeOf(root))) {
    const { children } = root.props || root;
    return lastLeaf(children[children.length - 1]);
  } else {
    return root;
  }
}

export function nextStep(pathSoFar, targetPath, followPathToEnd = false) {
  if (pathSoFar === targetPath) {
    return { idx: -1, finalStep: true };
  }
  var regex = new RegExp(`^${pathSoFar}.`);
  const endOfTheLine = followPathToEnd ? 0 : 1;
  // check that pathSoFar startsWith targetPath and if not, throw
  var paths = targetPath
    .replace(regex, '')
    .split('.')
    .map((n) => parseInt(n, 10));
  return { idx: paths[0], finalStep: paths.length === endOfTheLine };
}

export function resetPath(model, path, additionalProps) {
  if (getProp(model, 'path') === path) {
    return model;
  }
  const children = [];
  // React.Children.map rewrites keys, forEach does not
  React.Children.forEach(model.props.children, (child, i) => {
    if (!getProp(child, 'path')) {
      children.push(child);
    } else {
      children.push(resetPath(child, `${path}.${i}`));
    }
  });
  const pathPropName = model.props['data-path'] ? 'data-path' : 'path';
  return React.cloneElement(model, { [pathPropName]: path, ...additionalProps }, children);
}
