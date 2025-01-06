import {
  AriaOrientation,
  GridLayoutProvider,
  GridPlaceholder,
  ResizeOrientation,
} from "@finos/vuu-layout";
import cx from "clsx";
import {
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  useImperativeHandle,
} from "react";
import { GridLayoutItemProps } from "./GridLayoutItem";
import { useGridSplitterResizing } from "./useGridSplitterResizing";
import { GridModelConstructorProps } from "./GridModel";
import { useGridLayout } from "./useGridLayout";

const classBase = "vuuGridLayout";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  ariaOrientation: AriaOrientation;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  "aria-controls": ariaControls,
  ariaOrientation,
  orientation,
  ...htmlAttributes
}: GridSplitterProps) => {
  const id = `${ariaControls}-splitter-${orientation[0]}`;
  return (
    <div
      {...htmlAttributes}
      aria-controls={ariaControls}
      aria-orientation={ariaOrientation}
      className="vuuGridSplitter"
      id={id}
      role="separator"
    />
  );
};

export interface GridLayoutProps
  extends GridModelConstructorProps,
    HTMLAttributes<HTMLDivElement> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  layoutAPI?: ForwardedRef<LayoutAPI>;
}

export interface LayoutAPI {
  addGridColumn: (id: string) => void;
  addGridRow: (id: string) => void;
  removeGridColumn: (trackIndex: number) => void;
  splitGridCol: (id: string) => void;
  splitGridRow: (id: string) => void;
}

export const GridLayout = ({
  id,
  children: childrenProp,
  colCount,
  cols,
  className,
  layoutAPI,
  onClick,
  rowCount,
  rows,
  style: styleProp,
  ...htmlAttributes
}: GridLayoutProps) => {
  const { containerCallback, containerRef, gridModel, onDragEnd } =
    useGridLayout({
      colCount,
      cols,
      rowCount,
      rows,
    });

  const {
    addGridColumn,
    addGridRow,
    children,
    dispatchGridLayoutAction,
    onDragStart,
    onDrop,
    removeGridColumn,
    splitGridCol,
    splitGridRow,
    nonContentGridItems: { placeholders, splitters },
    ...layoutProps
  } = useGridSplitterResizing({
    children: childrenProp,
    containerRef,
    gridModel,
    id,
    onClick,
  });

  useImperativeHandle(
    layoutAPI,
    () => ({
      addGridColumn,
      addGridRow,
      removeGridColumn,
      splitGridCol,
      splitGridRow,
    }),
    [addGridColumn, addGridRow, removeGridColumn, splitGridCol, splitGridRow],
  );

  const style = {
    "--col-count": colCount,
    "--row-count": rowCount,
    gridTemplateColumns: gridModel.gridTemplateColumns,
    gridTemplateRows: gridModel.gridTemplateRows,
    ...styleProp,
  } as CSSProperties;

  return (
    <GridLayoutProvider
      dispatchGridLayoutAction={dispatchGridLayoutAction}
      gridModel={gridModel}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div
        {...htmlAttributes}
        {...layoutProps}
        ref={containerCallback}
        style={style}
        className={cx(classBase, className)}
        onDragEnd={onDragEnd}
      >
        {children}
        {placeholders.map((placeholder) => (
          <GridPlaceholder
            id={placeholder.id}
            key={placeholder.id}
            style={{
              gridColumn: `${placeholder.column.start}/${placeholder.column.end}`,
              gridRow: `${placeholder.row.start}/${placeholder.row.end}`,
            }}
          />
        ))}
        {splitters.map((splitter) => (
          <GridSplitter
            aria-controls={splitter.controls}
            ariaOrientation={splitter.ariaOrientation}
            id={splitter.id}
            key={splitter.id}
            orientation={splitter.orientation}
            style={{
              gridColumn: `${splitter.column.start}/${splitter.column.end}`,
              gridRow: `${splitter.row.start}/${splitter.row.end}`,
            }}
          />
        ))}
      </div>
    </GridLayoutProvider>
  );
};
