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

export interface ToolbarProps extends OverflowContainerProps {
  activeItemIndex?: number[];
  defaultActiveItemIndex?: number[];
  onActiveChange?: (tabIndex: number[]) => void;
  selectionStrategy?: SelectionStrategy | SpecialKeyMultipleSelection;
}

export const Toolbar = ({
  activeItemIndex: activeItemIndexProp,
  defaultActiveItemIndex,
  children,
  className: classNameProp,
  id: idProp,
  onActiveChange,
  orientation = "horizontal",
  selectionStrategy = "none",
  ...props
}: ToolbarProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const { activeItemIndex, focusVisible, itemProps, ...toolbarHook } =
    useToolbar({
      activeItemIndex: activeItemIndexProp,
      defaultActiveItemIndex,
      containerRef: rootRef,
      onActiveChange,
      orientation,
      selectionStrategy,
    });

  console.log(`Toolbar sctiveItemIndex ${activeItemIndex.join(",")}`);

  const id = useId(idProp);
  const className = cx(classBase, `${classBase}-${orientation}`, classNameProp);

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
          className: cx("vuuToolbarItem", itemClassName, {
            "vuuToolbarItem-focusVisible": focusVisible === index,
          }),
          "data-overflow-priority": selected ? "1" : undefined,
          id: itemId,
          key: index,
          "aria-selected": selected,
          tabIndex: selected ? 0 : -1,
        });
      }),
    [activeItemIndex, children, focusVisible, id, itemProps]
  );

  return (
    <OverflowContainer
      {...props}
      {...toolbarHook.containerProps}
      className={cx(classBase, className)}
      {...props}
      ref={rootRef}
    >
      {items}
    </OverflowContainer>
  );
};
