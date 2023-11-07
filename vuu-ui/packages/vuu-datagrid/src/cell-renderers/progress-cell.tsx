import { LinearProgress } from "@salt-ds/lab";
import cx from "classnames";
import React from "react";

import { isTypeDescriptor } from "@finos/vuu-utils";
import { GridCellProps } from "../grid-cells";
import "./progress-cell.css";
import { ColumnTypeRendering } from "@finos/vuu-datagrid-types";

const ProgressCell = React.memo(function ProgressCell({
  column,
  columnMap,
  row,
}: GridCellProps) {
  const { width, type } = column;
  let showProgress = false;
  let percentage = -1;
  const value = row[column.key];
  if (
    isTypeDescriptor(type) &&
    (type.renderer as ColumnTypeRendering)?.associatedField
  ) {
    const associatedField = (type.renderer as ColumnTypeRendering)
      .associatedField as string;
    const associatedValue = row[columnMap[associatedField]];
    if (typeof value === "number" && typeof associatedValue === "number") {
      percentage = Math.min(Math.round((value / associatedValue) * 100), 100);
      showProgress = isFinite(percentage);
    } else {
      // Temp workaround for bug on server that sends aggregated values as strings
      const floatValue = parseFloat(value as string);
      if (Number.isFinite(floatValue)) {
        const floatOtherValue = parseFloat(associatedValue as string);
        if (Number.isFinite(floatOtherValue)) {
          percentage = Math.min(
            Math.round((floatValue / floatOtherValue) * 100),
            100
          );
          showProgress = isFinite(percentage);
        }
      }
    }
  }

  return (
    <div
      className={cx("vuuDataGridCell", { vuuProgressCell: showProgress })}
      style={{ marginLeft: column.marginLeft, width }}
    >
      {showProgress ? <LinearProgress value={percentage} /> : value}
    </div>
  );
});

export default ProgressCell;
