import React from "react";
import cx from "classnames";
import { LinearProgress } from "@heswell/uitk-lab";

import "./progress-cell.css";

const ProgressCell = React.memo(function ProgressCell({
  column,
  columnMap,
  row,
}) {
  const { width, type } = column;
  const { associatedField } = type.renderer;
  const value = row[column.key];
  const associatedValue = row[columnMap[associatedField]];
  const percentage =
    value === 0 ? 0 : Math.round((value / associatedValue) * 100);

  return (
    <div
      className={cx("vuuDataGridCell", "vuuProgressCell")}
      style={{ marginLeft: column.marginLeft, width }}
    >
      <LinearProgress size="small" value={percentage} />
    </div>
  );
});

export default ProgressCell;
