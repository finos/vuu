import { DataSource } from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { TableRowSelectHandler } from "@finos/vuu-table";
import { ColumnMap } from "@finos/vuu-utils";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
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

  const inputProps = {
    inputProps: {
      autoComplete: "off",
    },
    onChange: handleInputChange,
  };
  const controlProps = {};
  const tableHandlers = {
    onSelect: handleSelectRow,
  };

  return {
    controlProps,
    inputProps,
    isOpen,
    onOpenChange: handleOpenChange,
    tableHandlers,
    value,
  };
};
