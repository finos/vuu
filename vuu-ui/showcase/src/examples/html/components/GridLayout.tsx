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

const classBase = "vuuGridLayout";

export interface GridLayoutItemProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
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
  ...htmlAttributes
}: GridLayoutItemProps) => {
  return (
    <div {...htmlAttributes} className="vuuGridLayoutItem">
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
