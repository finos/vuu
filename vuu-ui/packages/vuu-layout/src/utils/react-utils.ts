import React, { ReactElement, ReactNode } from "react";

const EMPTY_ARRAY: ReactElement[] = [];

export const asReactElements = (children: ReactNode): ReactElement[] => {
  const count = React.Children.count(children);
  if (count === 1 && React.isValidElement(children)) {
    return [children];
  } else if (count > 1) {
    return children as ReactElement[];
  } else {
    return EMPTY_ARRAY;
  }
};
