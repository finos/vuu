import { CSSProperties, HTMLAttributes } from "react";
import cx from "classnames";
import { useSplitterResizing } from "./useSplitterResizing";

import "./GridLayout.css";

const classBase = "vuuGridLayout";

export interface GridLayoutProps extends HTMLAttributes<HTMLDivElement> {
  colCount: number;
  rowCount: number;
  rows?: (string | number)[];
}

export const GridLayout = ({
  children,
  colCount,
  className,
  rowCount,
  rows,
  ...htmlAttributes
}: GridLayoutProps) => {
  const { gridTemplateRows, ...splitterProps } = useSplitterResizing({
    rowCount,
    rows,
  });

  const style = {
    "--col-count": colCount,
    "--row-count": rowCount,
    gridTemplateRows,
  } as CSSProperties;

  return (
    <div
      {...htmlAttributes}
      {...splitterProps}
      style={style}
      className={cx(classBase, className)}
    >
      {children}
    </div>
  );
};
