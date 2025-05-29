import {
  isContainer,
  LayoutJSON,
  LayoutModel,
  WithActive,
} from "@vuu-ui/vuu-utils";
import React, { isValidElement, ReactElement } from "react";
import { getProp, getProps } from "./propUtils";
import { typeOf } from "./typeOf";

const removeFinalPathSegment = (path: string) => {
  const pos = path.lastIndexOf(".");
  if (pos === -1) {
    return path;
  } else {
    return path.slice(0, pos);
  }
};

const getChildren = (c: ReactElement) =>
  React.isValidElement(c.props.children)
    ? [c.props.children]
    : c.props.children;

/**
 * This is a very specific function at the moment. It resolves a path of the form
 * '#{componentid}.ACTIVE_CHILD'
 * It allows a templated path to be resolved to a concrete path at runtime.
 * The above pattern is used to identify a layout drop target. Further patterns
 * will be added if needed.
 */
export const resolvePath = (source: ReactElement, path = ""): string => {
  const [step1, ...steps] = path.split(".");
  if (step1?.startsWith("#")) {
    const node = findTargetById(source, step1.slice(1), true);
    if (node && steps.length) {
      return resolvePath(node, steps.join("."));
    }
  } else if (step1 === "ACTIVE_CHILD") {
    const { active } = getProps(source);
    const children = getChildren(source);
    const { path } = getProps(children[active]);
    return path;
  }

  return "";
};

/**
 * Similar to resolvePath but operates on a JSON
 * layout structure and returns the matching JSON node.
 */
export const resolveJSONPath = (
  source: LayoutJSON,
  path = "",
): LayoutJSON | undefined => {
  const [step1, ...steps] = path.split(".");
  if (step1?.startsWith("#")) {
    const node = findTargetJSONById(source, step1.slice(1), true);
    if (node && steps.length) {
      return resolveJSONPath(node, steps.join("."));
    }
  } else if (step1 === "ACTIVE_CHILD") {
    const { children, props } = source;
    const { active } = props as WithActive;
    if (typeof active === "number" && children?.[active]) {
      return children[active];
    }
  }
  return;
};

export function followPathToParent(
  source: ReactElement,
  path: string,
): ReactElement | null {
  const { "data-path": dataPath, path: sourcePath = dataPath } =
    getProps(source);

  if (path === "0") return null;
  if (path === sourcePath) return null;

  return followPath(source, removeFinalPathSegment(path), true);
}

export function findTarget(
  source: LayoutModel | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  test: (props: any) => boolean,
): LayoutModel | undefined {
  if (source) {
    const { children, ...props } = getProps(source);
    if (test(props)) {
      return source;
    }
    if (React.Children.count(children) > 0) {
      const array = React.isValidElement(children) ? [children] : children;
      for (const child of array) {
        const target = findTarget(child, test);
        if (target) {
          return target;
        }
      }
    }
  }
}

export function containerOf(
  source: LayoutModel,
  target: LayoutModel,
): LayoutModel | null {
  if (target === source) {
    return null;
  }
  const { path: sourcePath, children } = getProps(source);
  const { idx, finalStep } = nextStep(sourcePath, getProp(target, "path"));
  if (finalStep) {
    return source;
  }
  if (children === undefined || children[idx] === undefined) {
    return null;
  }
  return containerOf(children[idx], target);
}

export const getChild = (
  children: ReactElement[],
  idx: number,
): ReactElement | undefined => {
  if (React.isValidElement(children) && idx == 0) {
    return children;
  }
  if (Array.isArray(children)) {
    return children[idx];
  }
};

export function followPathToComponent(component: ReactElement, path: string) {
  const paths = path.split(".");
  let children = [component];

  for (let i = 0; i < paths.length; i++) {
    const idx = parseInt(paths[i]);
    const child = children[idx];
    if (i === paths.length - 1) {
      return child;
    }
    children = getChildren(child);
  }
}

const findTargetById = (
  source: ReactElement,
  id: string,
  throwIfNotFound = true,
): ReactElement | undefined => {
  const { children, id: idProp } = source.props;
  if (idProp === id) {
    return source;
  }

  if (React.Children.count(children) > 0) {
    const childArray = isValidElement(children) ? [children] : children;
    for (const child of childArray) {
      if (isValidElement(child)) {
        const target = findTargetById(child, id, false);
        if (target) {
          return target;
        }
      }
    }
  }

  if (throwIfNotFound === true) {
    throw Error(`pathUtils.findTargetById id #${id} not found in source`);
  }
};

const findTargetJSONById = (
  source: LayoutJSON,
  id: string,
  throwIfNotFound = true,
): LayoutJSON | undefined => {
  const { children, id: idProp } = source;
  if (idProp === id) {
    return source;
  }

  if (Array.isArray(children) && children.length > 0) {
    for (const child of children) {
      if (child !== null && typeof child === "object") {
        const target = findTargetJSONById(child, id, false);
        if (target) {
          return target;
        }
      }
    }
  }

  if (throwIfNotFound === true) {
    throw Error(`pathUtils.findTargetJSONById id #${id} not found in source`);
  }
};

export function followPath(
  source: LayoutModel,
  path: string,
): LayoutModel | undefined;
export function followPath(
  source: ReactElement,
  path: string,
  throwIfNotFound: true,
): ReactElement;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function followPath(source: any, path: any, throwIfNotFound = false) {
  if (path.startsWith("#")) {
    return findTargetById(source, path.slice(1), throwIfNotFound);
  }

  const { "data-path": dataPath, path: sourcePath = dataPath } =
    getProps(source);
  if (path.indexOf(sourcePath) !== 0) {
    throw Error(
      `pathUtils.followPath path ${path} is not within source path ${sourcePath}`,
    );
  }
  const route = path.slice(sourcePath.length + 1);
  if (route === "") {
    return source;
  }

  let target = source;
  const paths = route.split(".");

  for (let i = 0; i < paths.length; i++) {
    if (React.Children.count(target.props.children) === 0) {
      const message = `element at 0.${paths
        .slice(0, i)
        .join(".")} has no children, so cannot fulfill rest of path ${paths
        .slice(i)
        .join(".")}`;

      if (throwIfNotFound) {
        throw Error(message);
      } else {
        console.warn(message);
        return;
      }
    }

    target = getChild(target.props.children, parseInt(paths[i]));

    if (target === undefined) {
      const message = `model at 0.${paths
        .slice(0, i)
        .join(".")} has no children that fulfill next step of path ${paths
        .slice(i)
        .join(".")}`;

      if (throwIfNotFound) {
        throw Error(message);
      } else {
        console.warn(message);
      }
    }
  }
  return target;
}

export function nextLeaf(root: ReactElement, path: string) {
  const parent = followPathToParent(root, path);
  let pathIndices = path.split(".").map((idx) => parseInt(idx, 10));
  if (parent) {
    const lastIdx = pathIndices.pop();
    const { children } = parent.props;
    if (children.length - 1 > lastIdx!) {
      return firstLeaf(children[lastIdx! + 1]);
    } else {
      const parentIdx = pathIndices.pop();
      const nextParent = followPathToParent(root, getProp(parent, "path"));
      if (nextParent && typeof parentIdx === "number") {
        pathIndices = nextParent.props.path
          .split(".")
          .map((idx: string) => parseInt(idx, 10));
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

export function previousLeaf(root: ReactElement, path: string) {
  const pathIndices = path.split(".").map((idx) => parseInt(idx, 10));
  let lastIdx = pathIndices.pop();
  let parent = followPathToParent(root, path);
  if (parent != null && typeof lastIdx === "number") {
    const { children } = parent.props;
    if (lastIdx > 0) {
      return lastLeaf(children[lastIdx - 1]);
    } else {
      while (pathIndices.length > 1) {
        lastIdx = pathIndices.pop() as number;
        parent = followPathToParent(
          root,
          getProp(parent, "path"),
        ) as ReactElement;
        if (lastIdx > 0) {
          const nextStep = parent.props.children[lastIdx - 1];
          if (isContainer(typeOf(nextStep) as string)) {
            return lastLeaf(nextStep);
          }
          return nextStep;
        }
      }
    }
  }
  return lastLeaf(root);
}

function firstLeaf(layoutRoot: ReactElement): ReactElement {
  if (isContainer(typeOf(layoutRoot) as string)) {
    const { children } = layoutRoot.props || layoutRoot;
    return firstLeaf(children[0]);
  }
  return layoutRoot;
}

function lastLeaf(root: ReactElement): ReactElement {
  if (isContainer(typeOf(root) as string)) {
    const { children } = root.props || root;
    return lastLeaf(children[children.length - 1]);
  }
  return root;
}

type NextStepResult = {
  idx: number;
  finalStep: boolean;
};

export function nextStep(
  pathSoFar: string,
  targetPath: string,
  followPathToEnd = false,
): NextStepResult {
  if (pathSoFar === targetPath) {
    return { idx: -1, finalStep: true };
  }

  const pathVisited = `${pathSoFar}.`;
  if (!targetPath.startsWith(pathVisited)) {
    throw Error("pathUtils nextStep has strayed from the path");
  }

  const endOfTheLine = followPathToEnd ? 0 : 1;
  const paths = targetPath
    .replace(pathVisited, "")
    .split(".")
    .map((n) => parseInt(n, 10));
  return { idx: paths[0], finalStep: paths.length === endOfTheLine };
}

export function resetPath(
  model: ReactElement,
  path: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  additionalProps?: any,
): ReactElement {
  if (getProp(model, "path") === path) {
    return model;
  }
  const children: ReactElement[] = [];
  React.Children.forEach(model.props.children, (child, i) => {
    if (!getProp(child, "path")) {
      children.push(child);
    } else {
      children.push(resetPath(child, `${path}.${i}`));
    }
  });
  const pathPropName = model.props["data-path"] ? "data-path" : "path";
  return React.cloneElement(
    model,
    { [pathPropName]: path, ...additionalProps },
    children,
  );
}
