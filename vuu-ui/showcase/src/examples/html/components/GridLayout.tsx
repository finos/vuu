import {
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  useImperativeHandle,
} from "react";
import cx from "clsx";
import { useGridSplitterResizing } from "./useGridSplitterResizing";

import "./GridLayout.css";
import "./GridSplitter.css";

import { ResizeOrientation } from "./grid-dom-utils";
import { ISplitter } from "packages/vuu-layout/src";

const classBase = "vuuGridLayout";
const classBaseItem = "vuuGridLayoutItem";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps
  extends Pick<ISplitter, "align">,
    HTMLAttributes<HTMLDivElement> {
  "aria-controls": string;
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  align,
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
      data-align={align}
      id={id}
      role="separator"
    />
  );
};

export interface GridLayoutItemProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  resizeable?: GridResizeable;
}

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactElement<GridLayoutItemProps>[];
  colCount: number;
  layoutAPI?: ForwardedRef<LayoutAPI>;
  rowCount: number;
  rows?: (string | number)[];
}

export const GridLayoutItem = ({
  children,
  className: classNameProp,
  resizeable,
  ...htmlAttributes
}: GridLayoutItemProps) => {
  const className = cx(classBaseItem, {
    [`${classBaseItem}-resizeable-h`]: resizeable === "h",
    [`${classBaseItem}-resizeable-v`]: resizeable === "v",
    [`${classBaseItem}-resizeable-vh`]: resizeable === "hv",
  });
  return (
    <div {...htmlAttributes} className={className}>
      {children}
    </div>
  );
};

export interface LayoutAPI {
  splitGridCol: (id: string) => void;
  splitGridRow: (id: string) => void;
}

export const GridLayout = ({
  id,
  children,
  colCount,
  className,
  layoutAPI,
  rowCount,
  rows,
  ...htmlAttributes
}: GridLayoutProps) => {
  const {
    gridTemplateRows,
    splitGridCol,
    splitGridRow,
    containerRef,
    splitters,
    ...layoutProps
  } = useGridSplitterResizing({
    id,
    rowCount,
    rows,
  });

  useImperativeHandle(
    layoutAPI,
    () => ({
      splitGridCol,
      splitGridRow,
    }),
    [splitGridCol, splitGridRow]
  );

  console.log({ gridTemplateRows });

  const style = {
    "--col-count": colCount,
    "--row-count": rowCount,
    gridTemplateRows,
  } as CSSProperties;

  return (
    <div
      {...htmlAttributes}
      {...layoutProps}
      ref={containerRef}
      style={style}
      className={cx(classBase, className)}
    >
      {children}
      {splitters.map((splitter) => (
        <GridSplitter
          align={splitter.align}
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
  );
};
