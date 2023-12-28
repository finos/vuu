import {
  CSSProperties,
  ForwardedRef,
  HTMLAttributes,
  ReactElement,
  useCallback,
  useImperativeHandle,
} from "react";
import cx from "clsx";
import { useGridSplitterResizing } from "./useGridSplitterResizing";

import "./GridLayout.css";
import "./GridSplitter.css";

import { ResizeOrientation } from "./grid-dom-utils";

const classBase = "vuuGridLayout";
const classBaseItem = "vuuGridLayoutItem";

export type GridResizeable = "h" | "v" | "hv";

export interface GridSplitterProps extends HTMLAttributes<HTMLDivElement> {
  orientation: ResizeOrientation;
}

export const GridSplitter = ({
  orientation,
  ...htmlAttributes
}: GridSplitterProps) => {
  return (
    <div
      {...htmlAttributes}
      className={cx("vuuGridSplitter", `vuuGridSplitter-${orientation}`)}
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
  const onMouseOver = useCallback((e) => {
    console.log(`mouse over ${e.target.id}`);
  }, []);
  const onMouseOut = useCallback((e) => {
    console.log(`mouse out ${e.target.id}`);
  }, []);

  const className = cx(classBaseItem, {
    [`${classBaseItem}-resizeable-h`]: resizeable === "h",
    [`${classBaseItem}-resizeable-v`]: resizeable === "v",
    [`${classBaseItem}-resizeable-vh`]: resizeable === "hv",
  });
  return (
    <div
      {...htmlAttributes}
      className={className}
      onMouseOver={onMouseOver}
      onMouseOut={onMouseOut}
    >
      {children}
    </div>
  );
};

export interface LayoutAPI {
  splitGridCol: (id: string) => void;
  splitGridRow: (id: string) => void;
}

export const GridLayout = ({
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
    ...layoutProps
  } = useGridSplitterResizing({
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
    </div>
  );
};
