import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
import { PopupMenu } from "@finos/vuu-popups";
import { HTMLAttributes } from "react";
import cx from "clsx";

import "./ColumnMenu.css";

const classBase = "vuuColumnMenu";
export interface ColumnMenuProps extends HTMLAttributes<HTMLSpanElement> {
  column: RuntimeColumnDescriptor;
}

export const ColumnMenu = ({ className, column }: ColumnMenuProps) => {
  return (
    <PopupMenu
      className={cx(classBase, className)}
      data-embedded
      menuLocation="column-menu"
      menuOptions={{ column }}
    />
  );
};
