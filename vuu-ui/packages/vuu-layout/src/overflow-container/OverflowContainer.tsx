import { PopupMenu } from "@finos/vuu-popups";
import { orientationType } from "@finos/vuu-utils";
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
  debugId?: string;
  height: number;
  onSwitchWrappedItemIntoView?: (overflowItem: OverflowItem) => void;
  orientation?: orientationType;
  overflowIcon?: string;
}

const WrapContainer = React.memo(
  ({
    children,
    className: classNameProp,
    height: heightProp,
    onSwitchWrappedItemIntoView,
    orientation = "horizontal",
    overflowIcon,
  }: OverflowContainerProps) => {
    const childElements = asReactElements(children);
    const { menuActionHandler, menuBuilder, rootRef } = useOverflowContainer({
      itemCount: childElements.length,
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

    return (
      <div className={className} ref={rootRef} style={style}>
        {childElements.map((childEl, i) => {
          const {
            "data-overflow-priority": overflowPriority = "0",
            id: itemId,
            label = `Item ${i + 1}`,
          } = childEl.props;
          return (
            <div
              className={cx(`${classBase}-item`)}
              data-index={i}
              data-label={label}
              data-overflow-priority={overflowPriority}
              id={`${itemId}-wrapper`}
              key={i}
            >
              {childEl}
            </div>
          );
        })}
        <div className={`${classBase}-OverflowIndicator`} data-index="overflow">
          <PopupMenu
            icon={overflowIcon}
            menuBuilder={menuBuilder}
            menuActionHandler={menuActionHandler}
          />
        </div>
      </div>
    );
  }
);

WrapContainer.displayName = "OverflowContainer.InnerContainer";

export const OverflowContainer = forwardRef(function OverflowContainer(
  {
    children,
    className,
    height = 44,
    onSwitchWrappedItemIntoView,
    orientation,
    overflowIcon,
    ...htmlAttributes
  }: OverflowContainerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  return (
    <div
      {...htmlAttributes}
      className={cx(cx(classBase, className))}
      ref={forwardedRef}
    >
      <WrapContainer
        height={height}
        orientation={orientation}
        overflowIcon={overflowIcon}
        onSwitchWrappedItemIntoView={onSwitchWrappedItemIntoView}
      >
        {children}
      </WrapContainer>
    </div>
  );
});
