import type { GridModelChildItemProps } from "./GridModel";
import { GridLayoutContext } from "./GridLayoutContext";
import { getGridPosition } from "./grid-layout-utils";
import { useContext } from "react";

export const useGridChildProps = (props: GridModelChildItemProps) => {
  const { contentVisible, dropTarget, header, id, stackId, style, title } =
    props;
  const { gridModel, gridSnapshot } = useContext(GridLayoutContext);
  const snapshotItem = gridSnapshot?.items.find((item) => item.id === id);
  const stack =
    gridSnapshot?.stacks.find(
      ({ id: snapshotStackId }) => snapshotStackId === id,
    ) ?? gridSnapshot?.stacks.find(({ itemIds }) => itemIds.includes(id));
  const modelItem = gridModel?.getChildItem(id);
  const fallbackPosition = getGridPosition(style?.gridArea ?? "1/1/2/2");
  const position = snapshotItem
    ? {
        column: {
          end: snapshotItem.column.start + snapshotItem.column.span,
          start: snapshotItem.column.start,
        },
        row: {
          end: snapshotItem.row.start + snapshotItem.row.span,
          start: snapshotItem.row.start,
        },
      }
    : stack
      ? (() => {
          const firstMember = gridSnapshot?.items.find(
            ({ id: itemId }) => itemId === stack.itemIds[0],
          );
          return firstMember
            ? {
                column: {
                  end: firstMember.column.start + firstMember.column.span,
                  start: firstMember.column.start,
                },
                row: {
                  end: firstMember.row.start + firstMember.row.span,
                  start: firstMember.row.start,
                },
              }
            : fallbackPosition;
        })()
      : fallbackPosition;
  const isStackMember = stack !== undefined && stack.id !== id;

  return {
    contentDetached: modelItem?.contentDetached,
    contentVisible: isStackMember
      ? stack?.selectedItemId === id
      : (snapshotItem?.contentVisible ?? contentVisible),
    dragging: modelItem?.dragging,
    dropTarget: snapshotItem?.dropTarget ?? dropTarget,
    gridArea: `${position.row.start}/${position.column.start}/${position.row.end}/${position.column.end}`,
    header: snapshotItem?.header ?? header,
    horizontalSplitter: modelItem?.horizontalSplitter,
    stacked: isStackMember || stackId !== undefined,
    title: snapshotItem?.title ?? title,
    verticalSplitter: modelItem?.verticalSplitter,
  };
};
