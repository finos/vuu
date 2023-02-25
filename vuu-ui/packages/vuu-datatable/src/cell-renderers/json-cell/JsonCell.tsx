import { TableCellProps } from "@finos/vuu-datagrid-types";
import {
  isJsonAttribute,
  metadataKeys,
  registerComponent,
} from "@finos/vuu-utils";

import "./JsonCell.css";

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
  const className = rowKey === value ? "vuuJsonCell-name" : "vuuJsonCell-value";

  if (isToggle) {
    const toggleIcon = row[IS_EXPANDED] ? "minus-box" : "plus-box";
    return (
      <span className="vuuJsonCell-name vuuJsonCell-group">
        <span>{value}</span>
        <span className="vuuJsonCell-toggle" data-icon={toggleIcon} />
      </span>
    );
  } else if (value) {
    return <span className={className}>{value}</span>;
  } else {
    return null;
  }
};

registerComponent("json", JsonCell, "cell-renderer", {});
