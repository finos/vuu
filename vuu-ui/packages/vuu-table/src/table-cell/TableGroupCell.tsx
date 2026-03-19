import { GroupColumnDescriptor, TableCellProps } from "@vuu-ui/vuu-table-types";
import { Icon, ToggleIconButton } from "@vuu-ui/vuu-ui-controls";
import { getGroupIcon, getGroupValue } from "@vuu-ui/vuu-utils";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { MouseEvent, useCallback } from "react";
import { useCell } from "../useCell";

import tableCellCss from "./TableCell.css";
import tableGroupCellCss from "./TableGroupCell.css";
import { useHighlighting } from "../useHighlighting";

const classBase = "vuuTableGroupCell";

export const TableGroupCell = ({
  column,
  dataRow,
  onClick,
  searchPattern = "",
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
  const value = getGroupValue(columns, dataRow);
  const valueWithHighlighting = useHighlighting(value || "", searchPattern);

  const icon = getGroupIcon(columns, dataRow);
  const { className, style } = useCell(column, classBase);

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLDivElement>) => {
      onClick?.(evt, column);
    },
    [column, onClick],
  );

  const { childCount, isExpanded, isLeaf } = dataRow;

  // In a TreeTable, no nodes are tagged as leaf nodes, but those with childCount = 0
  // behave as leaf nodes
  const isLeafNode = isLeaf || childCount == 0;

  return (
    <div
      aria-colindex={1}
      className={cx(className, "vuuTableCell")}
      role="cell"
      style={style}
      onClick={isLeafNode ? undefined : handleClick}
    >
      <span className={`${classBase}-spacer`} />
      {isLeafNode ? null : <ToggleIconButton isExpanded={isExpanded} />}
      {icon ? <Icon name={icon} /> : null}
      <span className={`${classBase}-label`}>{valueWithHighlighting}</span>
    </div>
  );
};
