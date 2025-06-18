import React, { ReactElement } from "react";

export const getGridItemChild = (
  gridItems: ReactElement[],
  gridItemId: string,
): ReactElement => {
  const targetGridItem = gridItems.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (gridItem) => (gridItem.props as any)?.id === gridItemId,
  );
  if (targetGridItem) {
    return targetGridItem;
  } else {
    throw Error(`getGridItemChild #${gridItemId} not found`);
  }
};

export const addChildToStackedGridItem = (
  stackElement: ReactElement,
  childElement: ReactElement,
) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stackProps: any = stackElement.props;
  if (Array.isArray(stackProps.children)) {
    console.log(`children is an array`);
  }

  const stackChildren = stackProps.children;
  // can we add an imperative API method to Stack ?
  return React.cloneElement(
    stackElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { active: stackChildren.length } as any,
    stackChildren.concat(childElement),
  );
};
