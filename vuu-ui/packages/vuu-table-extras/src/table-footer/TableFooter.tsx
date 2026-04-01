import cx from "clsx";
import { HTMLAttributes, ReactNode, SyntheticEvent, useCallback } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import tableFooterCss from "./TableFooter.css";
import { queryClosest } from "@vuu-ui/vuu-utils";

export interface TableFooterProps extends HTMLAttributes<HTMLDivElement> {
  onInvokeAction?: (action: string) => void;
  tooltrayActions?: ReactNode;
}

const classBase = "vuuTableFooter";

export const TableFooterTray = ({ children }: { children: ReactNode }) => {
  return <div className={`${classBase}Tray`}>{children}</div>;
};

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

  const handleAction = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      const {
        dataset: { action },
      } = queryClosest(e.target, "[data-action]", true);
      if (action) {
        onInvokeAction?.(action);
      }
    },
    [onInvokeAction],
  );

  return (
    <div {...htmlAttributes} className={cx(classBase, className)}>
      {children}
      {tooltrayActions ? (
        <div className={`${classBase}-tooltray`}>{tooltrayActions}</div>
      ) : null}
    </div>
  );
};
