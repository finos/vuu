import { useLookupValues } from "@vuu-ui/vuu-data-react";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { ListOption, TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  getSelectedOption,
  isRpcSuccess,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { Dropdown, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  SyntheticEvent,
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
  onEdit,
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
  const valueRef = useRef<ListOption>(undefined);

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
    async (evt: SyntheticEvent, [selectedOption]: ListOption[]) => {
      if (selectedOption) {
        // Note, we do not setState locally when a selection is made, we just send the update
        // to the server. We rely on the update coming back in from a server response which
        // we handle in the useMemo above. If we worry that server repsonses might be too slow
        // we can extend this logic with some kind of pending update state.
        const response = await onEdit?.(
          {
            editType: "commit",
            previousValue: valueRef.current?.value,
            value: selectedOption.value as VuuColumnDataType,
          },
          "commit",
        );
        if (isRpcSuccess(response)) {
          dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
        }
      }
    },
    [onEdit],
  );

  const handleClick = useCallback<MouseEventHandler<HTMLButtonElement>>(() => {
    if (!open) {
      setOpen(true);
    }
  }, [open]);

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      if (e.key === "Enter" && !open) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
      }
    },
    [open],
  );

  const { current: selectedOption } = valueRef;
  return (
    <Dropdown<ListOption>
      className={classBase}
      data-icon="triangle-down"
      onClick={handleClick}
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
}, dataColumnAndKeyUnchanged);

registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});
