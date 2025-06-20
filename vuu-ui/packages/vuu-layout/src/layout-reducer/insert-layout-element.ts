/* eslint-disable @typescript-eslint/no-explicit-any */
import { LayoutModel, rectTuple, uuid } from "@vuu-ui/vuu-utils";
import React, { ReactElement } from "react";
import { DropPos } from "../drag-drop";
import { DropTarget } from "../drag-drop/DropTarget";
import { getProp, getProps, nextStep, resetPath, typeOf } from "../utils";
import {
  createPlaceHolder,
  flexDirection,
  getFlexDimensions,
  getFlexOrIntrinsicStyle,
  getIntrinsicSize,
  wrapIntrinsicSizeComponentWithFlexbox,
} from "./flexUtils";
import {
  LayoutProps,
  getDefaultTabLabel,
  getManagedDimension,
} from "./layoutUtils";

type insertionPosition = "before" | "after";

export function getInsertTabBeforeAfter(stack: LayoutModel, pos: DropPos) {
  const { children: tabs } = stack.props as any;
  const tabCount = tabs.length;
  const { index = -1, positionRelativeToTab = "after" } = pos.tab || {};
  return index === -1 || index >= tabCount
    ? [tabs[tabCount - 1], "after"]
    : [tabs[index] ?? null, positionRelativeToTab];
}

export function insertIntoContainer(
  container: ReactElement,
  targetContainer: ReactElement,
  newComponent: ReactElement | ReactElement[],
): ReactElement {
  const {
    active: containerActive,
    children: containerChildren = [],
    path: containerPath,
  } = getProps(container) as LayoutProps;

  const existingComponentPath = getProp(targetContainer, "path");
  const { idx, finalStep } = nextStep(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    containerPath!,
    existingComponentPath,
    true,
  );
  const [insertedIdx, children] = finalStep
    ? insertIntoChildren(container, containerChildren, newComponent)
    : [
        containerActive,
        containerChildren?.map((child, index) =>
          index === idx
            ? (insertIntoContainer(
                child,
                targetContainer,
                newComponent,
              ) as ReactElement)
            : child,
        ),
      ];
  const active =
    typeOf(container) === "Stack"
      ? Array.isArray(insertedIdx)
        ? (insertedIdx[0] as number)
        : insertedIdx
      : containerActive;

  return React.cloneElement(container, { active } as any, children);
}

const getDefaultTitle = (
  containerType: string | undefined,
  component: ReactElement,
  index: number,
  existingLabels: string[],
) =>
  containerType === "Stack"
    ? getDefaultTabLabel(component, index, existingLabels)
    : undefined;

const getChildrenTitles = (children: ReactElement[]) =>
  children.map((child) => (child.props as any).title);

function insertIntoChildren(
  container: ReactElement,
  containerChildren: ReactElement[],
  newComponent: ReactElement | ReactElement[],
): [number, ReactElement[]] {
  if (Array.isArray(newComponent)) {
    const [firstChild, ...rest] = newComponent;
    let [idx, children] = insertIntoChildren(
      container,
      containerChildren,
      firstChild,
    );
    for (const child of rest) {
      [, children] = insertIntoChildren(container, children, child);
    }
    return [idx, children];
  }

  const containerPath = getProp(container, "path");
  const count = containerChildren?.length;

  const {
    id = uuid(),
    title = getDefaultTitle(
      typeOf(container),
      newComponent,
      count ?? 0,
      getChildrenTitles(containerChildren),
    ),
  } = getProps(newComponent);

  if (count) {
    return [
      count,
      containerChildren.concat(
        resetPath(newComponent, `${containerPath}.${count}`, {
          id,
          key: id,
          title,
        }),
      ),
    ];
  } else {
    return [0, [resetPath(newComponent, `${containerPath}.0`, { id, title })]];
  }
}

export function insertBesideChild(
  container: ReactElement,
  existingComponent: any,
  newComponent: any,
  insertionPosition: insertionPosition,
  pos?: DropPos,
  clientRect?: any,
  dropRect?: any,
): ReactElement {
  const {
    active: containerActive,
    children: containerChildren,
    path: containerPath,
  } = getProps(container);

  const existingComponentPath = getProp(existingComponent, "path");
  const { idx, finalStep } = nextStep(containerPath, existingComponentPath);
  const [insertedIdx, children] = finalStep
    ? updateChildren(
        container,
        containerChildren,
        idx,
        newComponent,
        insertionPosition,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        pos!,
        clientRect,
        dropRect,
      )
    : [
        containerActive,
        containerChildren.map((child: ReactElement, index: number) =>
          index === idx
            ? insertBesideChild(
                child,
                existingComponent,
                newComponent,
                insertionPosition,
                pos,
                clientRect,
                dropRect,
              )
            : child,
        ),
      ];

  const active = typeOf(container) === "Stack" ? insertedIdx : containerActive;
  return React.cloneElement(container, { active } as any, children);
}

function updateChildren(
  container: LayoutModel,
  containerChildren: ReactElement[],
  idx: number,
  newComponent: ReactElement,
  insertionPosition: insertionPosition,
  pos: DropPos,
  clientRect: DropTarget["clientRect"],
  dropRect: DropTarget["dropRect"],
) {
  const intrinsicSize = getIntrinsicSize(newComponent);
  if (intrinsicSize?.width && intrinsicSize?.height) {
    return insertIntrinsicSizedComponent(
      container,
      containerChildren,
      idx,
      newComponent,
      insertionPosition,
      clientRect,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      dropRect!,
    );
  } else {
    return insertFlexComponent(
      container,
      containerChildren,
      idx,
      newComponent,
      insertionPosition,
      pos?.width || pos?.height,
      clientRect,
    );
  }
}

const getLeadingPlaceholderSize = (
  flexDirection: flexDirection,
  insertionPosition: insertionPosition,
  { top, right, bottom, left }: DropTarget["clientRect"],
  [rectLeft, rectTop, rectRight, rectBottom]: rectTuple,
) => {
  if (flexDirection === "column" && insertionPosition === "before") {
    return rectTop - top;
  } else if (flexDirection === "column") {
    return bottom - rectBottom;
  } else if (flexDirection === "row" && insertionPosition === "before") {
    return rectLeft - left;
  } else if (flexDirection === "row") {
    return right - rectRight;
  }
};

function insertIntrinsicSizedComponent(
  container: LayoutModel,
  containerChildren: ReactElement[],
  idx: number,
  newComponent: ReactElement,
  insertionPosition: insertionPosition,
  clientRect: DropTarget["clientRect"],
  dropRect: rectTuple,
) {
  const {
    style: { flexDirection },
  } = getProps(container);
  const [dimension, crossDimension, contraDirection] =
    getFlexDimensions(flexDirection);
  const { [crossDimension]: intrinsicCrossSize, [dimension]: intrinsicSize } =
    getIntrinsicSize(newComponent) as { height: number; width: number };
  const path = getProp(containerChildren[idx], "path");

  const placeholderSize = getLeadingPlaceholderSize(
    flexDirection,
    insertionPosition,
    clientRect,
    dropRect,
  );

  const [itemToInsert, size] =
    intrinsicCrossSize < clientRect[crossDimension]
      ? [
          wrapIntrinsicSizeComponentWithFlexbox(
            newComponent,
            contraDirection,
            path,
            clientRect,
            dropRect,
          ),
          intrinsicSize,
        ]
      : [newComponent, undefined];

  const placeholder = placeholderSize
    ? createPlaceHolder(path, placeholderSize, { flexGrow: 0, flexShrink: 0 })
    : undefined;

  if (intrinsicCrossSize > clientRect[crossDimension]) {
    containerChildren = containerChildren.map((child) => {
      if (getProp(child, "placeholder")) {
        return child;
      } else {
        const { [crossDimension]: intrinsicCrossChildSize } = getIntrinsicSize(
          child,
        ) as {
          height: number;
          width: number;
        };
        if (
          intrinsicCrossChildSize &&
          intrinsicCrossChildSize < intrinsicCrossSize
        ) {
          return wrapIntrinsicSizeComponentWithFlexbox(
            child,
            contraDirection,
            getProp(child, "path"),
          );
        } else {
          return child;
        }
      }
    });
  }

  return insertFlexComponent(
    container,
    containerChildren,
    idx,
    itemToInsert,
    insertionPosition,
    size,
    clientRect,
    placeholder,
  );
}

function insertFlexComponent(
  container: LayoutModel,
  containerChildren: ReactElement[],
  idx: number,
  newComponent: ReactElement,
  insertionPosition: "before" | "after",
  size: number | undefined,
  targetRect: DropTarget["clientRect"],
  placeholder?: ReactElement,
) {
  const containerPath = getProp(container, "path");
  let insertedIdx = 0;
  const children =
    !containerChildren || containerChildren.length === 0
      ? [newComponent]
      : containerChildren
          .reduce<ReactElement[]>((arr, child, i) => {
            if (idx === i) {
              const [existingComponent, insertedComponent] =
                getStyledComponents(container, child, newComponent, targetRect);
              if (insertionPosition === "before") {
                if (placeholder) {
                  arr.push(placeholder, insertedComponent, existingComponent);
                } else {
                  arr.push(insertedComponent, existingComponent);
                }
              } else {
                if (placeholder) {
                  arr.push(existingComponent, insertedComponent, placeholder);
                } else {
                  arr.push(existingComponent, insertedComponent);
                }
              }
              insertedIdx = arr.indexOf(insertedComponent);
            } else {
              arr.push(child);
            }
            return arr;
          }, [])
          .map((child, i) =>
            i < insertedIdx ? child : resetPath(child, `${containerPath}.${i}`),
          );

  return [insertedIdx, children];
}

function getStyledComponents(
  container: LayoutModel,
  existingComponent: ReactElement,
  newComponent: ReactElement,
  targetRect: DropTarget["clientRect"],
): [ReactElement, ReactElement] {
  const id = uuid();
  let { version = 0 } = getProps(newComponent);
  version += 1;
  if (typeOf(container) === "Flexbox") {
    const { style: containerStyle } = container.props as any;
    const [dim] = getManagedDimension(containerStyle);
    const splitterSize = 6;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const size = { [dim]: (targetRect[dim] - splitterSize) / 2 };
    const existingComponentStyle = getFlexOrIntrinsicStyle(
      existingComponent,
      dim,
      size,
    );
    const newComponentStyle = getFlexOrIntrinsicStyle(newComponent, dim, size);

    return [
      React.cloneElement(existingComponent, {
        style: existingComponentStyle,
      } as any),
      React.cloneElement(newComponent, {
        id,
        version,
        style: newComponentStyle,
      } as any),
    ];
  } else {
    const {
      style: { left: _1, top: _2, flex: _3, ...style } = {
        left: undefined,
        top: undefined,
        flex: undefined,
      },
    } = getProps(newComponent);
    return [
      existingComponent,
      React.cloneElement(newComponent, {
        id,
        version,
        style: { ...style, flex: "1 1 0px" },
      } as any),
    ];
  }
}
