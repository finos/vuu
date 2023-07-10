import React, {
  CSSProperties,
  HTMLAttributes,
  ReactElement,
  ReactNode,
  useLayoutEffect,
  useRef,
} from "react";
import cx from "classnames";
import { PopupMenu } from "@finos/vuu-popups";
import { useOverflowContainer } from "./useOverflowContainer";

import "./OverflowContainer.css";

const classBase = "vuuOverflowContainer";

export interface OverflowContainerProps extends HTMLAttributes<HTMLDivElement> {
  debugId?: string;
}

const EMPTY_ARRAY: ReactElement[] = [];

const asReactElements = (children: ReactNode): ReactElement[] => {
  const count = React.Children.count(children);
  if (count === 1 && React.isValidElement(children)) {
    return [children];
  } else if (count > 1) {
    return children as ReactElement[];
  } else {
    return EMPTY_ARRAY;
  }
};

const InnerContainer = React.memo(({ children }: OverflowContainerProps) => {
  const firstTime = useRef(true);
  useLayoutEffect(() => {
    firstTime.current = false;
  });
  const { menuActionHandler, menuBuilder, rootRef } = useOverflowContainer();
  // TODO measure the height
  const style = {
    "--overflow-container-height": "44px",
  } as CSSProperties;

  return (
    <div className={`${classBase}-wrapContainer`} ref={rootRef} style={style}>
      {asReactElements(children).map((childElement, i) => (
        <div className={cx(`${classBase}-item`)} data-index={i} key={i}>
          {childElement}
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
});

InnerContainer.displayName = "OverflowContainer.InnerContainer";

export const OverflowContainer = ({
  children,
  className,
  ...htmlAttributes
}: OverflowContainerProps) => {
  return (
    <div {...htmlAttributes} className={cx(cx(classBase, className))}>
      <InnerContainer>{children}</InnerContainer>
    </div>
  );
};
