import { useLookupValues } from "@finos/vuu-data-react";
import { ListOption, TableCellRendererProps } from "@finos/vuu-datagrid-types";
import {
  dispatchCommitEvent,
  Dropdown,
  DropdownOpenKey,
  SingleSelectionHandler,
  WarnCommit,
} from "@finos/vuu-ui-controls";
import { registerComponent } from "@finos/vuu-utils";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { memo, useCallback, useState } from "react";
import { dataAndColumnUnchanged } from "../cell-utils";

import "./DropdownCell.css";

const classBase = "vuuTableDropdownCell";

const openKeys: DropdownOpenKey[] = ["Enter", " "];

export const DropdownCell = memo(function DropdownCell({
  column,
  columnMap,
  onCommit = WarnCommit,
  row,
}: TableCellRendererProps) {
  const dataIdx = columnMap[column.name];

  const { initialValue, values } = useLookupValues(column, row[dataIdx]);

  const [value, setValue] = useState<ListOption | null>(null);

  const handleSelectionChange = useCallback<SingleSelectionHandler<ListOption>>(
    (evt, selectedOption) => {
      if (selectedOption) {
        setValue(selectedOption);
        onCommit(selectedOption.value as VuuColumnDataType).then((response) => {
          if (response === true && evt) {
            dispatchCommitEvent(evt.target as HTMLElement);
          }
        });
      }
    },
    [onCommit]
  );

  return (
    <Dropdown<ListOption>
      className={classBase}
      onSelectionChange={handleSelectionChange}
      openKeys={openKeys}
      selected={value ?? initialValue}
      source={values}
      width={column.width - 17} // temp hack
    />
  );
},
dataAndColumnUnchanged);

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {});
