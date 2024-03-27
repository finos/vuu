import {
  ColumnDescriptor,
  TableCellRendererProps,
} from "@finos/vuu-table-types";
import { CycleStateCommitHandler, WarnCommit } from "@finos/vuu-ui-controls";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  isTypeDescriptor,
  isValueListRenderer,
  registerComponent,
} from "@finos/vuu-utils";
import cx from "clsx";

import { memo, useCallback } from "react";
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
  const value = row[dataIdx] as string;

  const handleCommit = useCallback<CycleStateCommitHandler>(
    (evt, value) => {
      return onCommit(value).then((response) => {
        if (response === true) {
          dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
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
dataColumnAndKeyUnchanged);

registerComponent("toggle-cell", ToggleCell, "cell-renderer", {
  userCanAssign: false,
});
