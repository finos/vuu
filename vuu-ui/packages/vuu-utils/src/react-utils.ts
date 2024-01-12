import { Children, isValidElement, ReactElement, ReactNode } from "react";

const EMPTY_ARRAY: ReactElement[] = [];

export const asReactElements = (children: ReactNode): ReactElement[] => {
  const isArray = Array.isArray(children);
  const count = isArray ? children.length : Children.count(children);
  if (isArray && children.every(isValidElement)) {
    return children;
  } else if (count === 1 && !isArray && isValidElement(children)) {
    return [children];
  } else if (count > 1) {
    return children as ReactElement[];
  } else {
    return EMPTY_ARRAY;
  }
};
