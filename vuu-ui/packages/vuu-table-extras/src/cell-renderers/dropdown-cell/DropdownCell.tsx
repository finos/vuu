import { useLookupValues } from "@vuu-ui/vuu-data-react";
import type { VuuColumnDataType } from "@vuu-ui/vuu-protocol-types";
import { ListOption, TableCellRendererProps } from "@vuu-ui/vuu-table-types";
import {
  dataColumnAndKeyUnchanged,
  dispatchCustomEvent,
  getSelectedOption,
  isCharacterKey,
  isRpcSuccess,
  registerComponent,
} from "@vuu-ui/vuu-utils";
import { isEditRowReadOnly } from "@vuu-ui/vuu-data-editing";
import cx from "clsx";
import { Dropdown, Option } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  FocusEventHandler,
  KeyboardEventHandler,
  MouseEventHandler,
  SyntheticEvent,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import dropdownCellCss from "./DropdownCell.css";

const classBase = "vuuTableDropdownCell";

// Salt uses this to match typed characters against options
const optionToString = ({ label }: ListOption) => label;

export const DropdownCell = memo(
  function DropdownCell({
    column,
    dataRow,
    editedDuringCurrentSession,
    onEdit,
  }: TableCellRendererProps) {
    const targetWindow = useWindow();
    useComponentCssInjection({
      testId: "vuu-dropdown-cell",
      css: dropdownCellCss,
      window: targetWindow,
    });

    if (editedDuringCurrentSession) {
      console.log(`${column.name} edited ${editedDuringCurrentSession}`);
    }

    const [open, setOpen] = useState(false);
    const dataValue = dataRow[column.name] as string | number;
    const readOnly = isEditRowReadOnly(dataRow);
    const { values } = useLookupValues(column, dataValue);
    const valueRef = useRef<ListOption>(undefined);
    const buttonRef = useRef<HTMLButtonElement>(null);
    // Characters typed while closed, replayed once the list is open
    const pendingKeysRef = useRef("");

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
              isValid: true,
              previousValue: valueRef.current?.value,
              value: selectedOption.value as VuuColumnDataType,
            },
            "commit",
          );
          if (isRpcSuccess(response)) {
            // TODO this should be done in TableCell
            dispatchCustomEvent(evt.target as HTMLElement, "vuu-commit");
          }
        }
      },
      [onEdit],
    );

    const handleClick = useCallback<
      MouseEventHandler<HTMLButtonElement>
    >(() => {
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
        } else if (
          !open &&
          !readOnly &&
          isCharacterKey(e.key) &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          // Salt only finds options for typeahead once the list has rendered
          // open, so open first, then replay the key.
          e.preventDefault();
          e.stopPropagation();
          pendingKeysRef.current += e.key;
          setOpen(true);
        }
      },
      [open, readOnly],
    );

    useEffect(() => {
      const { current: button } = buttonRef;
      const keys = pendingKeysRef.current;
      if (open && button && keys) {
        pendingKeysRef.current = "";
        requestAnimationFrame(() => {
          for (const key of keys) {
            button.dispatchEvent(
              new KeyboardEvent("keydown", {
                bubbles: true,
                cancelable: true,
                key,
              }),
            );
          }
        });
      }
    }, [open]);

    // Focus moved in from the enclosing cell (Enter) opens the list, as Enter
    // on an InputCell enters edit mode.
    const handleFocus = useCallback<FocusEventHandler<HTMLButtonElement>>(
      (e) => {
        const source = e.relatedTarget as HTMLElement | null;
        if (
          source?.classList.contains("vuuTableCell") &&
          source.contains(e.target)
        ) {
          setOpen(true);
        }
      },
      [],
    );

    const { current: selectedOption } = valueRef;
    return (
      <Dropdown<ListOption>
        className={cx(classBase, {
          [`${classBase}-edited`]: editedDuringCurrentSession === true,
        })}
        OverlayProps={{ className: `${classBase}-options` }}
        title={selectedOption?.label}
        onClick={handleClick}
        onFocus={handleFocus}
        onKeyDownCapture={handleKeyDown}
        onOpenChange={handleOpenChange}
        onSelectionChange={handleSelectionChange}
        open={open}
        readOnly={readOnly}
        ref={buttonRef}
        selected={selectedOption ? [selectedOption] : []}
        value={selectedOption?.label}
        valueToString={optionToString}
      >
        {values.map((listOption, i) => (
          <Option key={i} value={listOption}>
            {listOption.label}
          </Option>
        ))}
      </Dropdown>
    );
  },
  (p: TableCellRendererProps, p1: TableCellRendererProps) =>
    p.editedDuringCurrentSession !== p1.editedDuringCurrentSession &&
    dataColumnAndKeyUnchanged(p, p1),
);
registerComponent("dropdown-cell", DropdownCell, "cell-renderer", {
  userCanAssign: false,
});
