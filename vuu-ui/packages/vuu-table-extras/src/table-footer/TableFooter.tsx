import cx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import tableFooterCss from "./TableFooter.css";

export interface TableFooterProps extends HTMLAttributes<HTMLDivElement> {
  onInvokeAction?: (action: string) => void;
  tooltrayActions?: ReactNode;
}

const classBase = "vuuTableFooter";

export const TableFooterTray = ({
  children,
  position = "end",
}: {
  children: ReactNode;
  position?: "center" | "end";
}) => {
  return (
    <div
      className={cx(`${classBase}Tray`, {
        [`${classBase}Tray-center`]: position === "center",
        [`${classBase}Tray-end`]: position === "end",
      })}
    >
      {children}
    </div>
  );
};

/**
 * A footer below a Table, with trays at the center and end. Styled with:
 *
 * - `--vuuTableFooter-height` (default 32px), including the top border
 * - `--vuuTableFooter-background`
 * - `--vuuTableFooter-borderTop` (default none), e.g. `1px solid ...`
 */
export const TableFooter = ({
  children,
  className,
  onInvokeAction,
  tooltrayActions,
  ...htmlAttributes
}: TableFooterProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-footer",
    css: tableFooterCss,
    window: targetWindow,
  });

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {children}
      {tooltrayActions ? (
        <div className={`${classBase}-tooltray`}>{tooltrayActions}</div>
      ) : null}
    </div>
  );
};
