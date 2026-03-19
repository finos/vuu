import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { MouseEventHandler, useCallback } from "react";
import { useClientTableColumn } from "../ClientTableColumnProvider/ClientTableColumnProvider";
import cx from "clsx";

import "./PinButtonCell.css";

const classBase = "vuuPinButtonCell";

export const PinButtonCell = ({ dataRow }: TableCellRendererProps) => {
  const { getValue, setValue } = useClientTableColumn();

  const value = getValue(dataRow.key);

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      setValue(dataRow.key, !value);
      evt.stopPropagation();
    },
    [dataRow, setValue, value],
  );

  const icon = value ? "pin-on" : "pin-off";

  return (
    <IconButton
      appearance="transparent"
      className={cx(classBase, {
        [`${classBase}-pinned`]: value,
      })}
      data-embedded
      icon={icon}
      onClick={handleClick}
    />
  );
};
