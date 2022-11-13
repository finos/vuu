import React, { useCallback, useContext } from "react";
import cx from "classnames";
import { metadataKeys } from "@finos/vuu-utils";
import GridContext from "../grid-context";
import { getGroupValueAndOffset } from "../grid-model/grid-model-utils";

import "./grid-group-cell.css";

const { DEPTH, KEY, IS_EXPANDED, COUNT } = metadataKeys;

/** @type {GroupCellType} */
export const GroupCell = React.memo(function GroupCell({
  column,
  row,
  toggleStrategy,
}) {
  const { dispatchGridAction } = useContext(GridContext);

  const handleClick = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      const type = row[IS_EXPANDED] ? "closeTreeNode" : "openTreeNode";
      dispatchGridAction({ type, key: row[KEY] });
    },
    [dispatchGridAction, row]
  );

  const allowToggle =
    toggleStrategy.expand_level_1 !== false || row[DEPTH] !== 1;
  const count = row[COUNT];
  const [value, offset] = getGroupValueAndOffset(column.columns, row);

  return (
    <div
      className={cx("vuuDataGridCell", { noToggle: !allowToggle })}
      onClick={handleClick}
      style={{ width: column.width }}
      tabIndex={0}
    >
      {offset !== null ? (
        <div
          className={"GridGroupCell"}
          style={{ paddingLeft: (offset - 1) * 20 }}
          tabIndex={0}
        >
          {allowToggle ? (
            <span className="hwIconContainer" data-icon={"arrow-right"} />
          ) : null}
          <span className="group-value">{value}</span>
          <span> ({count})</span>
        </div>
      ) : null}
    </div>
  );
});
