import { HTMLAttributes, forwardRef } from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import cellBlockCss from "./CellBlock.css";

const classBase = "vuuCellBlock";

export interface CellBlockProps extends HTMLAttributes<HTMLDivElement> {
  debugName?: string;
}

export const CellBlock = forwardRef<HTMLDivElement, CellBlockProps>(
  function CellBlock({ className, ...htmlAttributes }, forwardedRef) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-cell-block",
      css: cellBlockCss,
      window: targetWindow,
    });

    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className)}
        ref={forwardedRef}
      />
    );
  },
);
