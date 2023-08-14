import { TableCellProps } from "@finos/vuu-datagrid-types";
import cx from "classnames";
import {
  isJsonAttribute,
  metadataKeys,
  registerComponent,
} from "@finos/vuu-utils";

import "./JsonCell.css";

const classBase = "vuuJsonCell";

const { IS_EXPANDED, KEY } = metadataKeys;

const localKey = (key: string) => {
  const pos = key.lastIndexOf("|");
  if (pos === -1) {
    return "";
  } else {
    return key.slice(pos + 1);
  }
};

const JsonCell = ({ column, row }: TableCellProps) => {
  const { key: columnKey /*, type, valueFormatter */ } = column;
  let value = row[columnKey];
  let isToggle = false;
  if (isJsonAttribute(value)) {
    value = value.slice(0, -1);
    isToggle = true;
  }
  const rowKey = localKey(row[KEY]);
  const className = cx({
    [`${classBase}-name`]: rowKey === value,
    [`${classBase}-value`]: rowKey !== value,
    [`${classBase}-group`]: isToggle,
  });

  if (isToggle) {
    const toggleIcon = row[IS_EXPANDED] ? "minus-box" : "plus-box";
    return (
      <span className={className}>
        <span className={`${classBase}-value`}>{value}</span>
        <span className={`${classBase}-toggle`} data-icon={toggleIcon} />
      </span>
    );
  } else if (value) {
    return <span className={className}>{value}</span>;
  } else {
    return null;
  }
};

registerComponent("json", JsonCell, "cell-renderer", {});
