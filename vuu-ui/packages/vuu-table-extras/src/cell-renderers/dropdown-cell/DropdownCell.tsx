import { useLookupValues } from "@finos/vuu-data-react";
import type { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { ListOption, TableCellRendererProps } from "@finos/vuu-table-types";
import { WarnCommit } from "@finos/vuu-ui-controls";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  getSelectedOption,
  registerComponent,
} from "@finos/vuu-utils";
import { Dropdown, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  KeyboardEventHandler,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import dropdownCellCss from "./DropdownCell.css";

const classBase = "vuuTableDropdownCell";

export const DropdownCell = memo(function DropdownCell({
  column,
  columnMap,
  onCommit = WarnCommit,
  row,
}: TableCellRendererProps) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-dropdown-cell",
    css: dropdownCellCss,
    window: targetWindow,
  });

  const [open, setOpen] = useState(false);
  const dataIdx = columnMap[column.name];
  const dataValue = row[dataIdx] as string | number;
  const { values } = useLookupValues(column, dataValue);
  const valueRef = useRef<ListOption>();

  useMemo(() => {
    valueRef.current = getSelectedOption(values, dataValue);
  }, [dataValue, values]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    console.log(`handleOpenChange ${isOpen}`);
    if (isOpen === false) {
      setOpen(false);
    }
  }, []);

  const handleSelectionChange = useCallback(
    (evt, [selectedOption]) => {
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

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      console.log(`keydown ${e.key}`);
      if (e.key === "Enter" && !open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    },
    [open]
  );

  const { current: selectedOption } = valueRef;
  return (
    <Dropdown<ListOption>
      className={classBase}
      data-icon="triangle-down"
      onKeyDownCapture={handleKeyDown}
      onOpenChange={handleOpenChange}
      onSelectionChange={handleSelectionChange}
      open={open}
      selected={selectedOption ? [selectedOption] : []}
      value={selectedOption?.label}
    >
      {values.map((listOption, i) => (
        <Option key={i} value={listOption}>
          {listOption.label}
        </Option>
      ))}
    </Dropdown>
  );
},
dataColumnAndKeyUnchanged);

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});
