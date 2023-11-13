import cx from "classnames";
import React, { useMemo, useRef } from "react";
import {
  OverflowContainer,
  OverflowContainerProps,
} from "../overflow-container";
import { asReactElements, useId } from "../utils";
import { useToolbar } from "./useToolbar";
import {
  forwardCallbackProps,
  SelectionStrategy,
  SpecialKeyMultipleSelection,
} from "@finos/vuu-ui-controls";

import "./Toolbar.css";

const classBase = "vuuToolbar";

export type ActiveItemChangeHandler = (itemIndex: number[]) => void;

export type NavigationOutOfBoundsHandler = (direction: "start" | "end") => void;
export interface ToolbarProps extends OverflowContainerProps {
  activeItemIndex?: number[];
  alignItems?: "start" | "center" | "end";
  defaultActiveItemIndex?: number[];
  onActiveChange?: ActiveItemChangeHandler;
  /**
   * Indicates that user has used Arrow key navigation to move beyond the
   * last or before the first item. A higher level component may want to
   * use this to implement a seamless navigation across components.
   */
  onNavigateOutOfBounds?: NavigationOutOfBoundsHandler;
  selectionStrategy?: SelectionStrategy | SpecialKeyMultipleSelection;
  showSeparators?: boolean;
}

export const Toolbar = ({
  activeItemIndex: activeItemIndexProp,
  alignItems = "start",
  defaultActiveItemIndex,
  children,
  className,
  id: idProp,
  onActiveChange,
  onNavigateOutOfBounds,
  orientation = "horizontal",
  selectionStrategy = "none",
  showSeparators = false,
  ...props
}: ToolbarProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    activeItemIndex,
    focusableIdx,
    focusVisible,
    itemProps,
    ...toolbarHook
  } = useToolbar({
    activeItemIndex: activeItemIndexProp,
    defaultActiveItemIndex,
    containerRef: rootRef,
    onActiveChange,
    onNavigateOutOfBounds,
    orientation,
    selectionStrategy,
  });

  const id = useId(idProp);

  const items = useMemo(
    () =>
      asReactElements(children).map((child, index) => {
        const {
          id: itemId = `${id}-tab-${index}`,
          className: itemClassName,
          ...ownProps
        } = child.props;
        const selected = activeItemIndex.includes(index);
        return React.cloneElement(child, {
          ...forwardCallbackProps(ownProps, itemProps),
          className: cx("vuuToolbarItem", itemClassName),
          "data-overflow-priority": selected ? "1" : undefined,
          id: itemId,
          key: index,
          "aria-selected": selected,
          tabIndex: focusableIdx === index ? 0 : -1,
        });
      }),
    [activeItemIndex, children, focusableIdx, id, itemProps]
  );

  return (
    <OverflowContainer
      {...props}
      {...toolbarHook.containerProps}
      className={cx(className, classBase, `${classBase}-${orientation}`, {
        [`${classBase}-alignCenter`]: alignItems === "center",
        [`${classBase}-alignEnd`]: alignItems === "end",
        [`${classBase}-withSeparators`]: showSeparators,
      })}
      {...props}
      ref={rootRef}
    >
      {items}
    </OverflowContainer>
  );
};
