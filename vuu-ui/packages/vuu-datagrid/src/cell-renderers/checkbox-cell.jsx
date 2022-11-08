// @ts-nocheck
import React from "react";
import cx from "classnames";
import { metadataKeys } from "@vuu-ui/vuu-utils";

import "./checkbox-cell.css";

const CheckboxCell = function CheckboxCell({ column, row }) {
  const className = cx("vuuDataGridCell", "Checkbox", {
    checked: row[metadataKeys.SELECTED] === 1,
    emptyRow: row[metadataKeys.KEY] === undefined,
  });
  return (
    <div className={className} style={{ width: column.width }} tabIndex={0} />
  );
};

export default CheckboxCell;
