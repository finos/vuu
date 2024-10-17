import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";

import treeTableCss from "./TreeTable.css";
import { HTMLAttributes } from "react";

const classBase = "vuuTreeTable";

export interface TreeTableProps extends HTMLAttributes<HTMLDivElement> {
  debugString?: string;
}

export const TreeTable = ({
  className,
  debugString,
  ...htmlAttributes
}: TreeTableProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-tree-table",
    css: treeTableCss,
    window: targetWindow,
  });

  return <div {...htmlAttributes} className={cx(classBase, className)} />;
};
