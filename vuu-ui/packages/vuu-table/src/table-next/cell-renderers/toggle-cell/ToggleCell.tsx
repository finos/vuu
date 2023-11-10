import {
  ColumnDescriptor,
  TableCellRendererProps,
} from "@finos/vuu-datagrid-types";
import {
  CycleStateButtonProps,
  dispatchCommitEvent,
  WarnCommit,
} from "@finos/vuu-ui-controls";
import {
  isTypeDescriptor,
  isValueListRenderer,
  registerComponent,
} from "@finos/vuu-utils";
import cx from "classnames";

import { memo, useCallback } from "react";
import { dataAndColumnUnchanged } from "../cell-utils";
import { CycleStateButton } from "@finos/vuu-ui-controls";

import "./ToggleCell.css";

const classBase = "vuuTableToggleCell";

const getValueList = ({ name, type }: ColumnDescriptor) => {
  if (isTypeDescriptor(type) && isValueListRenderer(type.renderer)) {
    return type.renderer.values;
  } else {
    throw Error(
      `useLookupValues column ${name} has not been configured with a values list`
    );
  }
};

export const ToggleCell = memo(function ToggleCell({
  column,
  columnMap,
  onCommit = WarnCommit,
  row,
}: TableCellRendererProps) {
  const values = getValueList(column);
  const dataIdx = columnMap[column.name];
  const value = row[dataIdx];

  const handleCommit = useCallback<CycleStateButtonProps["onCommit"]>(
    (evt, value) => {
      return onCommit(value).then((response) => {
        if (response === true) {
          dispatchCommitEvent(evt.target as HTMLElement);
        }
        return response;
      });
    },
    [onCommit]
  );

  return (
    <CycleStateButton
      className={cx(classBase, `${classBase}-${column.name}`)}
      onCommit={handleCommit}
      value={value}
      values={values}
      variant="cta"
    >
      {value}
    </CycleStateButton>
  );
},
dataAndColumnUnchanged);

registerComponent("toggle-cell", ToggleCell, "cell-renderer", {});
