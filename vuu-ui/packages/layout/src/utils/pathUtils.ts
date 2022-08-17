import React, { ReactElement } from 'react';
import { LayoutModel, LayoutRoot } from '../layout-reducer';
import { isContainer } from '../registry/ComponentRegistry';
import { getProp, getProps } from './propUtils';
import { typeOf } from './typeOf';

// TODO isn't this equivalent to containerOf ?
export function followPathToParent(source: LayoutModel, path: string) {
  const { 'data-path': dataPath, path: sourcePath = dataPath } = getProps(source);

  if (path === '0') return null;
  if (path === sourcePath) return null;

  return followPath(source, path.replace(/.\d+$/, ''));
}

export function findTarget(
  source: LayoutModel,
  test: (props: any) => boolean
): LayoutModel | undefined {
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

export function containerOf(source: LayoutModel, target: LayoutModel): LayoutModel | null {
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
export const getChild = (children: ReactElement[], idx: number): ReactElement | undefined => {
  // idx may be a nu,mber or string
  if (React.isValidElement(children) && idx == 0) {
    return children;
  } else if (Array.isArray(children)) {
    return children[idx];
  }
};

// Use a path only to identify a component
export function followPathToComponent(component: ReactElement, path: string) {
  var paths = path.split('.');
  let children = [component];

  const getChildren = (c: ReactElement) =>
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

export function followPath(source: LayoutModel, path: string): LayoutModel | undefined {
  const { 'data-path': dataPath, path: sourcePath = dataPath } = getProps(source);
  if (path.indexOf(sourcePath) !== 0) {
    throw Error(`pathUtils.followPath path ${path} is not within model.path ${sourcePath}`);
  }

  let target: LayoutModel | undefined = source;

  var route = path.slice(sourcePath.length + 1);
  if (route === '') {
    return target;
  }
  var paths = route.split('.');

  let isElement = React.isValidElement(target);
  for (var i = 0; i < paths.length; i++) {
    if (
      (isElement && React.Children.count((target as ReactElement).props.children) === 0) ||
      (!isElement && (target as LayoutRoot).children === undefined)
    ) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join('.')} has no children, so cannot fulfill rest of path ${paths.slice(i).join('.')}`
      );
      return;
    }

    target = getChild(
      isElement ? (target as ReactElement).props.children : (target as LayoutRoot).children,
      parseInt(paths[i])
    );
    isElement = React.isValidElement(target);

    if (target === undefined) {
      console.log(
        `model at 0.${paths
          .slice(0, i)
          .join('.')} has no children that fulfill next step of path ${paths.slice(i).join('.')}`
      );
      return;
    }
  }
  return target;
}

export function nextLeaf(root: LayoutModel, path: string) {
  const parent = followPathToParent(root, path);
  let pathIndices = path.split('.').map((idx) => parseInt(idx, 10));
  if (parent) {
    const lastIdx = pathIndices.pop();
    const { children } = parent.props;
    if (children.length - 1 > lastIdx!) {
      return firstLeaf(children[lastIdx! + 1]);
    } else {
      const parentIdx = pathIndices.pop();
      const nextParent = followPathToParent(root, getProp(parent, 'path'));
      if (nextParent && typeof parentIdx === 'number') {
        pathIndices = nextParent.props.path.split('.').map((idx: string) => parseInt(idx, 10));
        if (nextParent.props.children.length - 1 > parentIdx) {
          const nextStep = nextParent.props.children[parentIdx + 1];
          if (isContainer(typeOf(nextStep) as string)) {
            return firstLeaf(nextStep);
          } else {
            return nextStep;
          }
        }
      }
    }
  }

  return firstLeaf(root);
}

export function previousLeaf(root: LayoutModel, path: string) {
  let pathIndices = path.split('.').map((idx) => parseInt(idx, 10));
  let lastIdx = pathIndices.pop();
  let parent = followPathToParent(root, path);
  if (parent != null && typeof lastIdx === 'number') {
    const { children } = parent.props;
    if (lastIdx > 0) {
      return lastLeaf(children[lastIdx - 1]);
    } else {
      while (pathIndices.length > 1) {
        lastIdx = pathIndices.pop() as number;
        parent = followPathToParent(root, getProp(parent, 'path')) as ReactElement;
        // pathIndices = nextParent.props.path
        //   .split(".")
        //   .map((idx) => parseInt(idx, 10));
        if (lastIdx > 0) {
          const nextStep = parent.props.children[lastIdx - 1];
          if (isContainer(typeOf(nextStep) as string)) {
            return lastLeaf(nextStep);
          } else {
            return nextStep;
          }
        }
      }
    }
  }
  return lastLeaf(root);
}

function firstLeaf(root: LayoutModel): LayoutModel {
  if (isContainer(typeOf(root) as string)) {
    const { children } = root.props || root;
    return firstLeaf(children[0]);
  } else {
    return root;
  }
}

function lastLeaf(root: LayoutModel): LayoutModel {
  if (isContainer(typeOf(root) as string)) {
    const { children } = root.props || root;
    return lastLeaf(children[children.length - 1]);
  } else {
    return root;
  }
}

type NextStepResult = {
  idx: number;
  finalStep: boolean;
};

export function nextStep(
  pathSoFar: string,
  targetPath: string,
  followPathToEnd = false
): NextStepResult {
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

export function resetPath(model: ReactElement, path: string, additionalProps?: any): ReactElement {
  if (getProp(model, 'path') === path) {
    return model;
  }
  const children: ReactElement[] = [];
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
