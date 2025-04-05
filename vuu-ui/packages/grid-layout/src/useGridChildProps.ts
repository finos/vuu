import { useContext } from "react";
import { GridModelChildItem, GridModelChildItemProps } from "./GridModel";
import { GridLayoutContext } from "./GridLayoutContext";
import { getGridPosition } from "./grid-layout-utils";

export const useGridChildProps = ({
  contentVisible,
  dropTarget,
  header,
  height,
  id,
  stackId,
  resizeable,
  style,
  title,
  type = "content",
  width,
  // TODO handle resizeable etc

  // no need to store gridStyle separately, we already have it in childItem row, column
}: GridModelChildItemProps) => {
  const { gridModel } = useContext(GridLayoutContext);

  let childItem = gridModel?.getChildItem(id);
  if (childItem) {
    // console.log(`already registered child item ${id}`);
  } else {
    const { column, row } = getGridPosition(style.gridArea);
    childItem = new GridModelChildItem({
      contentVisible,
      dropTarget,
      header,
      height,
      id,
      column,
      fixed: false,
      stackId,
      resizeable,
      row,
      title,
      type,
      width,
    });

    gridModel?.addChildItem(childItem);
  }

  return {
    contentDetached: childItem.contentDetached,
    contentVisible: childItem.contentVisible,
    dropTarget: childItem.dropTarget,
    header: childItem.header,
    stacked: childItem.stackId !== undefined,
    title: childItem.title,
    ...childItem.layoutStyle,
  };
};
