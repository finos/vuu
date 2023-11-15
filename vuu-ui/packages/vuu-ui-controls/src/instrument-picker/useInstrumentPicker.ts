import { DataSource } from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { TableRowSelectHandler } from "@finos/vuu-table";
import { ColumnMap, dispatchMouseEvent } from "@finos/vuu-utils";
import {
  ChangeEvent,
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useControlled } from "../common-hooks";
import { OpenChangeHandler } from "../dropdown";
import { InstrumentPickerProps } from "./InstrumentPicker";

export interface InstrumentPickerHookProps
  extends Pick<
    InstrumentPickerProps,
    "columnMap" | "itemToString" | "onOpenChange" | "onSelect" | "searchColumns"
  > {
  columns: ColumnDescriptor[];
  dataSource: DataSource;
  defaultIsOpen?: boolean;
  isOpen?: boolean;
}

const defaultItemToString =
  (columns: ColumnDescriptor[], columnMap: ColumnMap) =>
  (row: DataSourceRow) => {
    return columns.map(({ name }) => row[columnMap[name]]).join(" ");
  };

export const useInstrumentPicker = ({
  columnMap,
  columns,
  dataSource,
  defaultIsOpen,
  isOpen: isOpenProp,
  itemToString = defaultItemToString(columns, columnMap),
  onOpenChange,
  onSelect,
  searchColumns,
}: InstrumentPickerHookProps) => {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const tableRef = useRef<HTMLDivElement>(null);

  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
    [searchColumns]
  );

  const handleOpenChange = useCallback<OpenChangeHandler>(
    (open, closeReason) => {
      setIsOpen(open);
      onOpenChange?.(open, closeReason);
      // if (open === false) {
      //   dataSource.unsubscribe();
      // }
    },
    [onOpenChange, setIsOpen]
  );

  const handleInputChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { value } = evt.target;
      setValue(value);

      if (value && value.trim().length) {
        const filter = baseFilterPattern.replaceAll("__VALUE__", value);
        dataSource.filter = {
          filter,
        };
      } else {
        dataSource.filter = {
          filter: "",
        };
      }

      setIsOpen(true);
    },
    [baseFilterPattern, dataSource, setIsOpen]
  );

  const handleSelectRow = useCallback<TableRowSelectHandler>(
    (row) => {
      const value = itemToString(row);
      setValue(value);
      onSelect(row);
      handleOpenChange?.(false, "select");
    },
    [handleOpenChange, itemToString, onSelect]
  );

  const handleKeyDown = useCallback<KeyboardEventHandler>(
    (e) => {
      if (e.key === "ArrowDown") {
        setHighlightedIndex((index) => index + 1);
      } else if (e.key === "ArrowUp") {
        setHighlightedIndex((index) => Math.max(0, index - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        // induce an onSelect event by 'clicking' the row
        const rowEl = tableRef.current?.querySelector(
          `[aria-rowindex="${highlightedIndex}"]`
        ) as HTMLElement;
        if (rowEl) {
          dispatchMouseEvent(rowEl, "click");
        }
      }
    },
    [highlightedIndex]
  );

  const inputProps = {
    inputProps: {
      autoComplete: "off",
      onKeyDown: handleKeyDown,
    },
    onChange: handleInputChange,
  };
  const tableHandlers = {
    onSelect: handleSelectRow,
  };

  return {
    highlightedIndex,
    inputProps,
    isOpen,
    onOpenChange: handleOpenChange,
    tableHandlers,
    tableRef,
    value,
  };
};
