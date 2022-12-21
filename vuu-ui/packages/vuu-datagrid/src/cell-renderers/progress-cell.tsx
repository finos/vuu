import { LinearProgress } from "@heswell/salt-lab";
import cx from "classnames";
import React from "react";

import { GridCellProps } from "../grid-cells";
import { isTypeDescriptor } from "../grid-model";
import "./progress-cell.css";

const ProgressCell = React.memo(function ProgressCell({
  column,
  columnMap,
  row,
}: GridCellProps) {
  const { width, type } = column;
  let showProgress = false;
  let percentage = -1;
  const value = row[column.key];
  if (isTypeDescriptor(type) && type.renderer?.associatedField) {
    const { associatedField } = type.renderer;
    const associatedValue = row[columnMap[associatedField]];
    if (typeof value === "number" && typeof associatedValue === "number") {
      percentage = Math.min(Math.round((value / associatedValue) * 100), 100);
      showProgress = isFinite(percentage);
    }
  }

  return (
    <div
      className={cx("vuuDataGridCell", { vuuProgressCell: showProgress })}
      style={{ marginLeft: column.marginLeft, width }}
    >
      {showProgress ? (
        <LinearProgress size="small" value={percentage} />
      ) : (
        value
      )}
    </div>
  );
});

export default ProgressCell;
