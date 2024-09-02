import React, { ReactElement } from "react";
import { StackProps } from "../stack";

export const getGridItemChild = (
  gridItems: ReactElement[],
  gridItemId: string,
): ReactElement => {
  const targetGridItem = gridItems.find(
    (gridItem) => gridItem.props.id === gridItemId,
  );
  if (targetGridItem) {
    return targetGridItem;
  } else {
    throw Error(`getGridItemChild #${gridItemId} not found`);
  }
};

export const getGridItemComponent = (
  gridItems: ReactElement[],
  gridItemId: string,
): ReactElement => {
  const targetGridItem = getGridItemChild(gridItems, gridItemId);
  const childComponent = targetGridItem.props.children;
  if (React.isValidElement(childComponent)) {
    return childComponent;
  } else if (Array.isArray(childComponent)) {
    return childComponent.at(0) as ReactElement;
  } else {
    throw Error(`invalid child component`);
  }
};

export const addChildToStackedGridItem = (
  stackElement: ReactElement,
  childElement: ReactElement,
) => {
  if (Array.isArray(stackElement.props.children)) {
    console.log(`children is an array`);
  }

  const stackChildren = stackElement.props.children;
  // can we add an imperative API method to Stack ?
  return React.cloneElement(
    stackElement,
    { active: stackChildren.length } as StackProps,
    stackChildren.concat(childElement),
  );
};
