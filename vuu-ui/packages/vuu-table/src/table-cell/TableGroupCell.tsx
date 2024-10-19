import { GroupColumnDescriptor, TableCellProps } from "@finos/vuu-table-types";
import { ToggleIconButton } from "@finos/vuu-ui-controls";
import { getGroupValue, metadataKeys } from "@finos/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { MouseEvent, useCallback } from "react";
import { useCell } from "../useCell";

import tableCellCss from "./TableCell.css";
import tableGroupCellCss from "./TableGroupCell.css";

const { COUNT, IS_EXPANDED, IS_LEAF } = metadataKeys;

const classBase = "vuuTableGroupCell";

export const TableGroupCell = ({
  column,
  columnMap,
  onClick,
  row,
}: TableCellProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-cell",
    css: tableCellCss,
    window: targetWindow,
  });
  useComponentCssInjection({
    testId: "vuu-table-group-cell",
    css: tableGroupCellCss,
    window: targetWindow,
  });

  const { columns } = column as GroupColumnDescriptor;
  const value = getGroupValue(columns, row, columnMap);
  const { className, style } = useCell(column, classBase);

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      onClick?.(evt, column);
    },
    [column, onClick],
  );

  const { [COUNT]: count, [IS_EXPANDED]: isExpanded, [IS_LEAF]: isLeaf } = row;

  return (
    <div
      aria-colindex={1}
      className={cx(className, "vuuTableCell")}
      role="cell"
      style={style}
      onClick={isLeaf ? undefined : handleClick}
    >
      <span className={`${classBase}-spacer`} />
      {isLeaf || count == 0 ? null : (
        <ToggleIconButton isExpanded={isExpanded} />
      )}
      <span>{value}</span>
    </div>
  );
};
