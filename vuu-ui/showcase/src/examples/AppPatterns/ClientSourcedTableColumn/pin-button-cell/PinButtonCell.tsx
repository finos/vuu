import { TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import { IconButton } from "@vuu-ui/vuu-ui-controls";
import { metadataKeys } from "@vuu-ui/vuu-utils";
import { MouseEventHandler, useCallback } from "react";
import { useClientTableColumn } from "../ClientTableColumnProvider/ClientTableColumnProvider";
import cx from "clsx";

import "./PinButtonCell.css";

const classBase = "vuuPinButtonCell";

const { KEY } = metadataKeys;

export const PinButtonCell = ({ row }: TableCellRendererProps) => {
  const { getValue, setValue } = useClientTableColumn();

  const value = getValue(row[KEY] as string);
  console.log(`value = ${value}`);

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(
    (evt) => {
      setValue(row[KEY], !value);
      evt.stopPropagation();
    },
    [row, setValue, value],
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
