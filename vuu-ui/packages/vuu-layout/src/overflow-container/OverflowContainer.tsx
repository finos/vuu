import { PopupMenu, PopupMenuProps } from "@finos/vuu-popups";
import { orientationType } from "@finos/vuu-utils";
import { useId } from "@finos/vuu-layout";

import cx from "classnames";
import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
} from "react";
import { asReactElements } from "../utils";
import { OverflowItem } from "./overflow-utils";
import { useOverflowContainer } from "./useOverflowContainer";

import "./OverflowContainer.css";

const classBase = "vuuOverflowContainer";

export interface OverflowContainerProps extends HTMLAttributes<HTMLDivElement> {
  PopupMenuProps?: Partial<PopupMenuProps>;
  allowDragDrop?: boolean;
  debugId?: string;
  height: number;
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
    className: classNameProp,
    height: heightProp,
    id,
    onMoveItem,
    onSwitchWrappedItemIntoView,
    orientation = "horizontal",
    overflowIcon,
    overflowPosition = "end",
  }: OverflowContainerProps) => {
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

    const height = orientation === "vertical" ? "100%" : `${heightProp}px`;
    // TODO measure the height, if not provided
    const style = {
      "--overflow-container-height": `${height}`,
    } as CSSProperties;

    const className = cx(`${classBase}-wrapContainer`, classNameProp, {
      [`${classBase}-horizontal`]: orientation === "horizontal",
      [`${classBase}-vertical`]: orientation === "vertical",
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
          icon={overflowIcon}
          menuBuilder={menuBuilder}
          menuActionHandler={menuActionHandler}
          tabIndex={-1}
        />
      </div>
    );

    content.push(overflowIndicator);

    return (
      <div className={className} ref={rootRef} style={style}>
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
    height = 44,
    id: idProp,
    onMoveItem,
    onSwitchWrappedItemIntoView,
    orientation,
    overflowIcon,
    overflowPosition,
    ...htmlAttributes
  }: OverflowContainerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const id = useId(idProp);

  return (
    <div
      {...htmlAttributes}
      className={cx(cx(className, classBase))}
      id={id}
      ref={forwardedRef}
    >
      <WrapContainer
        PopupMenuProps={PopupMenuProps}
        allowDragDrop={allowDragDrop}
        height={height}
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
