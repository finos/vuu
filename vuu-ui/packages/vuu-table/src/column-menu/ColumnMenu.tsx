import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { PopupMenu } from "@finos/vuu-popups";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { HTMLAttributes } from "react";
import cx from "clsx";

import columnMenuCss from "./ColumnMenu.css";

const classBase = "vuuColumnMenu";
export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: RuntimeColumnDescriptor;
}

export const ColumnMenu = ({ className, column }: ColumnMenuProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-column-menu",
    css: columnMenuCss,
    window: targetWindow,
  });

  return (
    <PopupMenu
      className={cx(classBase, className)}
      data-embedded
      menuLocation="column-menu"
      menuOptions={{ column }}
    />
  );
};
