import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  type DragEventHandler,
  type HTMLAttributes,
  type MouseEventHandler,
  type PointerEventHandler,
  useCallback,
  useRef,
} from "react";
import {
  type GridLayoutHeaderLocation,
  useHeaderSlotRef,
} from "./GridLayoutHeaderSlots";
import { IconButton } from "./IconButton";

import gridLayoutItemHeaderCss from "./GridLayoutItemHeader.css";

const classBase = "vuuGridLayoutItemHeader";

/**
 * A drag that starts on one of these is treated as an interaction with that
 * element, not as a drag of the GridLayoutItem.
 */
const NO_DRAG_SELECTOR =
  'button, a[href], input, select, textarea, [contenteditable="true"], [role="button"], [data-no-drag]';

export interface GridLayoutHeaderSlotProps {
  className?: string;
  itemId: string | undefined;
  location: GridLayoutHeaderLocation;
}

/**
 * An element that header contributions for `itemId` + `location` render into.
 */
export const GridLayoutHeaderSlot = ({
  className,
  itemId,
  location,
}: GridLayoutHeaderSlotProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout-item-header",
    css: gridLayoutItemHeaderCss,
    window: targetWindow,
  });
  const ref = useHeaderSlotRef(itemId, location);
  return (
    <div
      className={cx(`${classBase}-slot`, className)}
      data-slot={location}
      ref={ref}
    />
  );
};

export interface GridLayoutItemHeaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /**
   * Id of the GridLayoutItem; contributions from components hosted in that
   * item render into this header.
   */
  itemId: string;
  onClose?: MouseEventHandler<HTMLButtonElement>;
  title?: string;
}

export const GridLayoutItemHeader = ({
  className,
  itemId,
  onClose,
  onDragStart,
  onPointerDown,
  title,
  ...htmlAttributes
}: GridLayoutItemHeaderProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout-item-header",
    css: gridLayoutItemHeaderCss,
    window: targetWindow,
  });

  const dragBlockedRef = useRef(false);

  const handlePointerDown = useCallback<PointerEventHandler<HTMLDivElement>>(
    (evt) => {
      const target = evt.target as HTMLElement;
      const interactive = target.closest(NO_DRAG_SELECTOR);
      dragBlockedRef.current =
        interactive !== null && evt.currentTarget.contains(interactive);
      onPointerDown?.(evt);
    },
    [onPointerDown],
  );

  const handleDragStart = useCallback<DragEventHandler<HTMLDivElement>>(
    (evt) => {
      if (dragBlockedRef.current) {
        evt.preventDefault();
        evt.stopPropagation();
      } else {
        onDragStart?.(evt);
      }
    },
    [onDragStart],
  );

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      data-drop-target="header"
      data-title={title}
      draggable
      onDragStart={handleDragStart}
      onPointerDown={handlePointerDown}
    >
      <GridLayoutHeaderSlot
        className={`${classBase}-start`}
        itemId={itemId}
        location="start"
      />
      <div className={`${classBase}-titleContainer vuuDraggableLabel`}>
        <GridLayoutHeaderSlot
          className={`${classBase}-titleSlot`}
          itemId={itemId}
          location="title"
        />
        <span className={`${classBase}-title`}>{title}</span>
      </div>
      <GridLayoutHeaderSlot
        className={`${classBase}-center`}
        itemId={itemId}
        location="center"
      />
      <GridLayoutHeaderSlot
        className={`${classBase}-end`}
        itemId={itemId}
        location="end"
      />
      <div className={`${classBase}-actions`}>
        {onClose ? (
          <IconButton
            appearance="transparent"
            aria-label="Close"
            className={`${classBase}-close`}
            icon="close"
            onClick={onClose}
            sentiment="neutral"
          />
        ) : null}
      </div>
    </div>
  );
};
