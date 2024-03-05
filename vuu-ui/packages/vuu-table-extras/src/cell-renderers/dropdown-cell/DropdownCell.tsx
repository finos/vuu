import { getSelectedOption, useLookupValues } from "@finos/vuu-data-react";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { ListOption, TableCellRendererProps } from "@finos/vuu-table-types";
import {
  Dropdown,
  DropdownOpenKey,
  SingleSelectionHandler,
  WarnCommit,
} from "@finos/vuu-ui-controls";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  registerComponent,
} from "@finos/vuu-utils";
import { memo, useCallback, useMemo, useRef } from "react";

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
  const dataValue = row[dataIdx] as string | number;
  const { values } = useLookupValues(column, dataValue);
  const valueRef = useRef<ListOption | null>(null);

  useMemo(() => {
    valueRef.current = getSelectedOption(values, dataValue);
  }, [dataValue, values]);

  const handleSelectionChange = useCallback<SingleSelectionHandler<ListOption>>(
    (evt, selectedOption) => {
      if (selectedOption) {
        // Note, we do not setState locally when a selection is made, we just send the update
        // to the server. We rely on the update coming back in from a server response which
        // we handle in the useMemo above. If we worry that server repsonses might be too slow
        // we can extend this logic with some kind of pending update state.
        onCommit(selectedOption.value as VuuColumnDataType).then((response) => {
          if (response === true && evt) {
            dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
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
      selected={valueRef.current}
      source={values}
      width={column.width - 17} // temp hack
    />
  );
},
dataColumnAndKeyUnchanged);

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});
