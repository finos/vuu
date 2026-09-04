import { registerComponent } from "@vuu-ui/vuu-utils";
import { useIdMemo } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import {
  cloneElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
} from "react";
import { DragDropProviderNext } from "./drag-drop-next/DragDropProviderNext";
import { getGridArea } from "./grid-layout-utils";
import { GridLayoutContext } from "./GridLayoutContext";
import type { GridLayoutItemProps } from "./GridLayoutItem";
import { GridLayoutStackedItem } from "./GridLayoutStackedtem";
import type {
  GridColumnsAndRows,
  GridLayoutChangeHandler,
  ISplitter,
} from "./GridModel";
import { GridPlaceholder } from "./GridPlaceholder";
import { useGridLayout } from "./useGridLayout";
import { useGridSplitterResizing } from "./useGridSplitterResizing";
import { GridSplitter } from "./GridSplitter";

import gridLayoutCss from "./GridLayout.css";

const classBase = "vuuGridLayout";

const startsAtHorizontalSplitter = (
  splitter: ISplitter,
  splitters: ISplitter[],
) =>
  splitter.ariaOrientation === "vertical" &&
  splitters.some(
    (candidate) =>
      candidate.ariaOrientation === "horizontal" &&
      candidate.row.start === splitter.row.start &&
      candidate.column.start <= splitter.column.start &&
      candidate.column.end > splitter.column.start,
  );

export type GridResizeable = "h" | "v" | "hv";
export type GridResizeDistribution = "adjacent" | "proportional";

export interface GridLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  "full-page"?: boolean;
  colsAndRows?: GridColumnsAndRows;
  onChange?: GridLayoutChangeHandler;
  /** Coupled boundaries with partial cross-group spans retain adjacent resizing. */
  rowResizeDistribution?: GridResizeDistribution;
}

const NO_DRAG_SOURCES = {} as const;

export const GridLayout = ({
  id: idProp,
  children: childrenProp,
  className,
  "full-page": fullPage,
  colsAndRows,
  onClick,
  onChange,
  rowResizeDistribution = "adjacent",
  style: styleProp,
  ...htmlAttributes
}: GridLayoutProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-grid-layout",
    css: gridLayoutCss,
    window: targetWindow,
  });

  const id = useIdMemo(idProp);

  const {
    children,
    containerCallback,
    dispatchGridLayoutAction,
    dragSourceItemId,
    gridController,
    gridLayoutModel,
    gridModel,
    gridSnapshot,
    nonContentGridItems: { placeholderIds, splitters, stackIds },
    onCancelDrag,
    onCancelTabDrag,
    onDetachTab,
    onDragEnd,
    onDragLeave,
    onDragPreview,
    onDragStart,
    onDrop,
    onDropStackedItem,
    stackTemplates,
  } = useGridLayout({
    children: childrenProp,
    id,
    colsAndRows,
    onChange,
  });

  const splitterLayoutProps = useGridSplitterResizing({
    gridLayoutModel,
    gridModel,
    gridController,
    id,
    onClick,
    rowResizeDistribution,
  });

  // const splitterProps = useGridSplitter();

  const style = {
    gridTemplateColumns: gridSnapshot.columns.map(({ size }) => size).join(" "),
    gridTemplateRows: gridSnapshot.rows.map(({ size }) => size).join(" "),
    ...styleProp,
  } as CSSProperties;
  const snapshotItemById = new Map(
    gridSnapshot.items.map((item) => [item.id, item]),
  );

  return (
    <GridLayoutContext.Provider
      value={{
        dispatchGridLayoutAction,
        dragSourceItemId,
        gridController,
        gridLayoutModel,
        gridModel,
        gridSnapshot,
        id,
        onDragEnd,
        onDragLeave,
        onDragPreview,
        onDragStart,
        onDrop,
      }}
    >
      <DragDropProviderNext
        dragSources={NO_DRAG_SOURCES}
        onCancelDrag={onCancelDrag}
        onCancelTabDrag={onCancelTabDrag}
        onDetachTab={onDetachTab}
        onDrop={onDropStackedItem}
      >
        <div
          {...htmlAttributes}
          {...splitterLayoutProps}
          id={id}
          ref={containerCallback}
          style={style}
          className={cx(classBase, className, {
            vuuFullPage: fullPage,
          })}
        >
          {stackIds.map((stackId) => {
            const template = stackTemplates.get(stackId);
            return template ? (
              cloneElement(template, { key: stackId })
            ) : (
              <GridLayoutStackedItem id={stackId} key={stackId} />
            );
          })}
          {children}
          {placeholderIds.map((placeholderId) => {
            const placeholder = snapshotItemById.get(placeholderId);
            if (!placeholder) {
              throw Error(
                `[GridLayout] canonical placeholder #${placeholderId} not found`,
              );
            }
            return (
              <GridPlaceholder
                id={placeholderId}
                key={placeholderId}
                style={{
                  gridArea: `${placeholder.row.start}/${placeholder.column.start}/${placeholder.row.start + placeholder.row.span}/${placeholder.column.start + placeholder.column.span}`,
                }}
              />
            );
          })}
          {splitters.map((splitter) => (
            <GridSplitter
              // {...splitterProps}
              aria-controls={splitter.controls}
              ariaOrientation={splitter.ariaOrientation}
              data-resized-child-items-after={splitter.resizedChildItems.after.join(
                " ",
              )}
              data-resized-child-items-before={splitter.resizedChildItems.before.join(
                " ",
              )}
              id={splitter.id}
              key={splitter.id}
              offsetStart={startsAtHorizontalSplitter(splitter, splitters)}
              orientation={splitter.orientation}
              style={{
                gridArea: getGridArea(splitter),
              }}
            />
          ))}
        </div>
      </DragDropProviderNext>
    </GridLayoutContext.Provider>
  );
};

GridLayout.displayName = "Grid";

registerComponent("Grid", GridLayout, "container");
