import { registerComponent } from "@vuu-ui/vuu-utils";
import { useIdMemo } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import type { CSSProperties, HTMLAttributes, ReactElement } from "react";
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
    gridLayoutModel,
    gridModel,
    nonContentGridItems: { placeholders, splitters, stackedItems },
    onCancelTabDrag,
    onDetachTab,
    onDragEnd,
    onDragStart,
    onDrop,
    onDropStackedItem,
  } = useGridLayout({
    children: childrenProp,
    id,
    colsAndRows,
    onChange,
  });

  const splitterLayoutProps = useGridSplitterResizing({
    gridLayoutModel,
    gridModel,
    id,
    onClick,
    rowResizeDistribution,
  });

  // const splitterProps = useGridSplitter();

  const style = {
    ...gridModel.tracks.css,
    ...styleProp,
  } as CSSProperties;

  return (
    <GridLayoutContext.Provider
      value={{
        dispatchGridLayoutAction,
        gridLayoutModel,
        gridModel,
        id,
        onDragEnd,
        onDragStart,
        onDrop,
      }}
    >
      <DragDropProviderNext
        dragSources={NO_DRAG_SOURCES}
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
          {stackedItems.map((stackedItem) => (
            <GridLayoutStackedItem
              id={stackedItem.id}
              key={stackedItem.id}
              style={{
                gridArea: getGridArea(stackedItem),
              }}
            />
          ))}
          {children}
          {placeholders.map((placeholder) => (
            <GridPlaceholder
              id={placeholder.id}
              key={placeholder.id}
              style={{
                gridArea: getGridArea(placeholder),
              }}
            />
          ))}
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
