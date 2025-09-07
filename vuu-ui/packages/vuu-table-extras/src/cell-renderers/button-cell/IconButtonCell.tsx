import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { MouseEventHandler, useCallback } from "react";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";

import iconButtonCellCss from "./IconButtonCell.css";
import { useRowAction } from "../../table-provider/TableProvider";
import { Button } from "@salt-ds/core";

const classBase = "vuuIconButtonCell";

/**
 * To assign an icon to the cell, give the columndescriptor
 * a className. In css, assign an icon variable to --vuu-svg-icon.
 */
export const IconButtonCell = ({ column, row }: TableCellRendererProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-dropdown-cell",
    css: iconButtonCellCss,
    window: targetWindow,
  });

  const actionHandler = useRowAction(column.name);
  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      evt.stopPropagation();
      actionHandler(column.name, row);
    },
    [actionHandler, column, row],
  );

  return (
    <Button
      appearance="transparent"
      className={classBase}
      data-embedded
      data-icon
      onClick={handleClick}
    />
  );
};
