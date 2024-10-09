import {
  HTMLAttributes,
  KeyboardEventHandler,
  forwardRef,
  useCallback,
} from "react";
import cx from "clsx";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import cellBlockCss from "./CellBlock.css";

const classBase = "vuuCellBlock";

export interface CellBlockProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onCopy"> {
  debugName?: string;
  onCopy?: () => void;
}

export const CellBlock = forwardRef<HTMLDivElement, CellBlockProps>(
  function CellBlock({ className, onCopy, ...htmlAttributes }, forwardedRef) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-cell-block",
      css: cellBlockCss,
      window: targetWindow,
    });

    const handleKeyDown = useCallback<KeyboardEventHandler>(
      async (evt) => {
        if (evt.metaKey && evt.key === "c") {
          onCopy?.();
        }
      },
      [onCopy],
    );

    return (
      <div
        {...htmlAttributes}
        className={cx(classBase, className)}
        ref={forwardedRef}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      />
    );
  },
);
