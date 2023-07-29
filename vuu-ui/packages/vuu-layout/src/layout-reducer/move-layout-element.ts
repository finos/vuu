import { cloneElement, ReactElement } from "react";
import { followPath, getProps } from "../utils";
import { MoveChildAction } from "./layoutTypes";
import { swapChild } from "./replace-layout-element";

export function moveChild(
  layoutRoot: ReactElement,
  { fromIndex, path, toIndex }: MoveChildAction
) {
  const target = followPath(layoutRoot, path, true);
  const { children } = getProps(target);
  const replacementChildren = moveChildWithinChildren(
    children,
    fromIndex,
    toIndex
  );
  const replacement = cloneElement(target, undefined, replacementChildren);
  return swapChild(layoutRoot, target, replacement);
}

function moveChildWithinChildren(
  children: ReactElement[],
  fromIndex: number,
  toIndex: number
) {
  const newChildren = children.slice();
  const [child] = newChildren.splice(fromIndex, 1);
  if (toIndex === -1) {
    return newChildren.concat(child);
  } else {
    newChildren.splice(toIndex, 0, child);
    return newChildren;
  }
}
