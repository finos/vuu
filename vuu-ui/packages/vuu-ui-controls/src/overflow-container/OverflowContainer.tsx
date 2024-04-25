import { PopupMenu, PopupMenuProps } from "@finos/vuu-popups";
import { asReactElements, orientationType, useId } from "@finos/vuu-utils";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import React, { ForwardedRef, forwardRef, HTMLAttributes } from "react";
import { OverflowItem } from "./overflow-utils";
import { useOverflowContainer } from "./useOverflowContainer";

import overflowContainerCss from "./OverflowContainer.css";

const classBase = "vuuOverflowContainer";

export interface OverflowContainerProps extends HTMLAttributes<HTMLDivElement> {
  PopupMenuProps?: Partial<PopupMenuProps>;
  allowDragDrop?: boolean;
  debugId?: string;
  onMoveItem?: (fromIndex: number, toIndex: number) => void;
  onSwitchWrappedItemIntoView?: (overflowItem: OverflowItem) => void;
  orientation?: orientationType;
  overflowIcon?: string;
  overflowPosition?: "start" | "end" | number;
}

const WrapContainer = React.memo(
  ({
    PopupMenuProps,
    allowDragDrop,
    children,
    id,
    onMoveItem,
    onSwitchWrappedItemIntoView,
    orientation,
    overflowIcon,
  }: Omit<OverflowContainerProps, "orientation"> &
    Required<Pick<OverflowContainerProps, "orientation">>) => {
    const childElements = asReactElements(children);
    const {
      draggable,
      draggedItemIndex,
      menuActionHandler,
      menuBuilder,
      onItemMouseDown,
      rootRef,
    } = useOverflowContainer({
      allowDragDrop,
      itemCount: childElements.length,
      onMoveItem,
      onSwitchWrappedItemIntoView,
      orientation,
    });

    const content = childElements.map((childEl, i) => {
      const {
        "data-align": align,
        "data-overflow-priority": overflowPriority = "0",
        id: itemId = `${id}-${i}`,
        label = `Item ${i + 1}`,
      } = childEl.props;
      return (
        <div
          className={cx(`${classBase}-item`, {
            "vuuDraggable-dragAway": draggedItemIndex === i,
          })}
          data-index={i}
          data-align={align}
          data-label={label}
          data-overflow-priority={overflowPriority}
          id={`${itemId}-wrapper`}
          key={i}
          onMouseDown={onItemMouseDown}
        >
          {childEl}
        </div>
      );
    });

    const overflowIndicator = (
      <div
        className={`${classBase}-OverflowIndicator`}
        data-index="overflow"
        key="overflow"
      >
        <PopupMenu
          {...PopupMenuProps}
          data-embedded
          icon={overflowIcon}
          menuBuilder={menuBuilder}
          menuActionHandler={menuActionHandler}
          tabIndex={-1}
        />
      </div>
    );
    content.push(overflowIndicator);

    return (
      <div className={cx(`${classBase}-wrapContainer`)} ref={rootRef}>
        {content}
        {draggable}
      </div>
    );
  }
);

WrapContainer.displayName = "OverflowContainer.InnerContainer";

export const OverflowContainer = forwardRef(function OverflowContainer(
  {
    PopupMenuProps,
    allowDragDrop = false,
    children,
    className,
    id: idProp,
    onMoveItem,
    onSwitchWrappedItemIntoView,
    orientation = "horizontal",
    overflowIcon,
    overflowPosition,
    ...htmlAttributes
  }: OverflowContainerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-overflow-container",
    css: overflowContainerCss,
    window: targetWindow,
  });

  const id = useId(idProp);

  return (
    <div
      {...htmlAttributes}
      className={cx(
        cx(className, classBase, {
          "vuuOrientation-horizontal": orientation === "horizontal",
          "vuuOrientation-vertical": orientation === "vertical",
        })
      )}
      id={id}
      ref={forwardedRef}
    >
      <WrapContainer
        PopupMenuProps={PopupMenuProps}
        allowDragDrop={allowDragDrop}
        id={id}
        orientation={orientation}
        overflowIcon={overflowIcon}
        overflowPosition={overflowPosition}
        onMoveItem={onMoveItem}
        onSwitchWrappedItemIntoView={onSwitchWrappedItemIntoView}
      >
        {children}
      </WrapContainer>
    </div>
  );
});
