import {
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

const classBase = "vuuGridLayout";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  "aria-controls": ariaControls,
  orientation,
  ...htmlAttributes
}: GridSplitterProps) => {
  const id = `${ariaControls}-splitter-${orientation[0]}`;
  return (
    <div
      {...htmlAttributes}
      aria-controls={ariaControls}
      className={cx("vuuGridSplitter", `vuuGridSplitter-${orientation}`)}
      id={id}
      role="separator"
    />
  );
};

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children?:
    | ReactElement<GridLayoutItemProps>
    | ReactElement<GridLayoutItemProps>[];
  colCount?: number;
  cols?: (string | number)[];
  layoutAPI?: ForwardedRef<LayoutAPI>;
  rowCount?: number;
  rows?: (string | number)[];
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
  const {
    addGridColumn,
    addGridRow,
    children,
    dispatchGridLayoutAction,
    gridTemplateColumns,
    gridTemplateRows,
    layoutMap,
    onDragStart,
    onDrop,
    removeGridColumn,
    splitGridCol,
    splitGridRow,
    containerRef,
    nonContentGridItems: { placeholders, splitters },
    ...layoutProps
  } = useGridSplitterResizing({
    children: childrenProp,
    colCount,
    cols,
    id,
    onClick,
    rowCount,
    rows,
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
    [addGridColumn, addGridRow, removeGridColumn, splitGridCol, splitGridRow]
  );

  const style = {
    "--col-count": colCount,
    "--row-count": rowCount,
    gridTemplateColumns,
    gridTemplateRows,
    ...styleProp,
  } as CSSProperties;

  return (
    <GridLayoutProvider
      dispatchGridLayoutAction={dispatchGridLayoutAction}
      layoutMap={layoutMap}
      onDragStart={onDragStart}
      onDrop={onDrop}
    >
      <div
        {...htmlAttributes}
        {...layoutProps}
        ref={containerRef}
        style={style}
        className={cx(classBase, className)}
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
