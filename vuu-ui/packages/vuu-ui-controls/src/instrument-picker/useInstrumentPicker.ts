import { DataSource } from "@finos/vuu-data";
import { TableRowSelectHandler } from "@finos/vuu-table";
import { ColumnMap } from "@finos/vuu-utils";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { useControlled } from "../common-hooks";

export interface InstrumentPickerHookProps {
  columnMap: ColumnMap;
  dataSource: DataSource;
  defaultIsOpen?: boolean;
  isOpen?: boolean;
  onSelect: TableRowSelectHandler;
  searchColumns: string[];
}

export const useInstrumentPicker = ({
  columnMap,
  dataSource,
  defaultIsOpen,
  isOpen: isOpenProp,
  onSelect,
  searchColumns,
}: InstrumentPickerHookProps) => {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  console.log({ dataSource });
  const baseFilterPattern = useMemo(
    // TODO make this contains once server supports it
    () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
    [searchColumns]
  );

  const handleOpenChange = useCallback(
    (open) => {
      setIsOpen(open);
    },
    [setIsOpen]
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
      const { name } = columnMap;
      const { [name]: value } = row;
      setValue(value as string);
      setIsOpen(false);
      onSelect(row);
    },
    [columnMap, onSelect, setIsOpen]
  );

  const inputProps = {
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
