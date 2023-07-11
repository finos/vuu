import React, {
  CSSProperties,
  ForwardedRef,
  forwardRef,
  HTMLAttributes,
} from "react";
import cx from "classnames";
import { PopupMenu } from "@finos/vuu-popups";
import { useOverflowContainer } from "./useOverflowContainer";
import { asReactElements } from "../utils";

import "./OverflowContainer.css";

const classBase = "vuuOverflowContainer";

export interface OverflowContainerProps extends HTMLAttributes<HTMLDivElement> {
  debugId?: string;
  height: number;
}

const InnerContainer = React.memo(
  ({ children, height }: OverflowContainerProps) => {
    const { menuActionHandler, menuBuilder, rootRef } = useOverflowContainer();
    // TODO measure the height
    const style = {
      "--overflow-container-height": `${height}px`,
    } as CSSProperties;

    return (
      <div className={`${classBase}-wrapContainer`} ref={rootRef} style={style}>
        {asReactElements(children).map((childEl, i) => (
          <div
            className={cx(`${classBase}-item`)}
            data-index={i}
            data-overflow-priority={
              childEl.props["data-overflow-priority"] ?? "0"
            }
            key={i}
          >
            {childEl}
          </div>
        ))}
        <div className={`${classBase}-OverflowIndicator`} data-index="overflow">
          <PopupMenu
            menuBuilder={menuBuilder}
            menuActionHandler={menuActionHandler}
          />
        </div>
      </div>
    );
  }
);

InnerContainer.displayName = "OverflowContainer.InnerContainer";

export const OverflowContainer = forwardRef(function OverflowContainer(
  {
    children,
    className,
    height = 44,
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
      <InnerContainer height={height}>{children}</InnerContainer>
    </div>
  );
});
