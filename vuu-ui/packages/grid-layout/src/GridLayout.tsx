import { registerComponent } from "@vuu-ui/vuu-utils";
import { useIdMemo } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { CSSProperties, HTMLAttributes, ReactElement } from "react";
import { DragDropProviderNext } from "./drag-drop-next/DragDropProviderNext";
import { getGridArea } from "./grid-layout-utils";
import { GridLayoutContext } from "./GridLayoutContext";
import { GridLayoutItemProps } from "./GridLayoutItem";
import { GridLayoutStackedItem } from "./GridLayoutStackedtem";
import { GridColumnsAndRows, GridLayoutChangeHandler } from "./GridModel";
import { GridPlaceholder } from "./GridPlaceholder";
import { useGridLayout } from "./useGridLayout";
import { useGridSplitterResizing } from "./useGridSplitterResizing";
import { GridSplitter } from "./GridSplitter";

import gridLayoutCss from "./GridLayout.css";

const classBase = "vuuGridLayout";

export type GridResizeable = "h" | "v" | "hv";

export interface GridLayoutProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  "full-page"?: boolean;
  colsAndRows?: GridColumnsAndRows;
  onChange?: GridLayoutChangeHandler;
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
          onDragEnd={onDragEnd}
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
              id={splitter.id}
              key={splitter.id}
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
