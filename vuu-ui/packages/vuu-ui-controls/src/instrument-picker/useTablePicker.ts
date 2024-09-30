import {
  ChangeEvent,
  RefCallback,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useControlled } from "../common-hooks";
import { TablePickerProps } from "./TablePicker";
import { buildColumnMap, useDataSource } from "@finos/vuu-utils";
import { TableConfig } from "@finos/vuu-table-types";

export interface TablePickerHookProps
  extends Pick<TablePickerProps, "onSelect" | "schema"> {
  defaultIsOpen?: boolean;
  isOpen?: boolean;
}

// const defaultItemToString = (row: DataSourceRowObject) =>
//   Object.values(row.data).join(" ");

export const useTablePicker = ({
  schema,
  defaultIsOpen,
  isOpen: isOpenProp,
  onSelect,
}: TablePickerHookProps) => {
  const { VuuDataSource } = useDataSource();
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useControlled<boolean>({
    controlled: isOpenProp,
    default: defaultIsOpen ?? false,
    name: "useDropdownList",
  });

  const widthRef = useRef(-1);
  const columnMap = useMemo(() => buildColumnMap(schema.columns), [schema]);
  console.log({ columnMap });

  const containerRef = useCallback<RefCallback<HTMLDivElement>>((el) => {
    widthRef.current = el?.clientWidth ?? -1;
  }, []);

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      table: schema.table,
    });
  }, [VuuDataSource, schema.table]);

  // const { highlightedIndexRef, onKeyDown, tableRef } =
  //   useControlledTableNavigation(-1, dataSource.size);

  // const baseFilterPattern = useMemo(
  //   // TODO make this contains once server supports it
  //   () => searchColumns.map((col) => `${col} starts "__VALUE__"`).join(" or "),
  //   [searchColumns],
  // );

  // const handleOpenChange = useCallback<OpenChangeHandler>(
  //   (open, closeReason) => {
  //     setIsOpen(open);
  //     onOpenChange?.(open, closeReason);
  //   },
  //   [onOpenChange, setIsOpen],
  // );

  const handleInputChange = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { value } = evt.target;
      setValue(value);

      // if (value && value.trim().length) {
      //   const filter = baseFilterPattern.replaceAll("__VALUE__", value);
      //   dataSource.filter = {
      //     filter,
      //   };
      // } else {
      //   dataSource.filter = {
      //     filter: "",
      //   };
      // }

      setIsOpen(true);
    },
    [setIsOpen],
  );

  // const handleSelectRow = useCallback<TableRowSelectHandler>(
  //   (row) => {
  //     const value = row === null ? "" : itemToString(row);
  //     setValue(value);
  //     onSelect?.(row);
  //     handleOpenChange?.(false, "select");
  //   },
  //   [handleOpenChange, onSelect],
  // );

  const inputProps = {
    inputProps: {
      autoComplete: "off",
      // onKeyDown,
    },
    onChange: handleInputChange,
  };
  // const tableHandlers = {
  //   onSelect: handleSelectRow,
  // };

  const tableConfig = useMemo<TableConfig>(() => {
    return {
      columns: schema.columns,
    };
  }, []);

  return {
    tableConfig,
    containerRef,
    dataSource,
    // highlightedIndex: highlightedIndexRef.current,
    inputProps,
    isOpen,
    // onOpenChange: handleOpenChange,
    // tableHandlers,
    // tableRef,
    value,
    width: widthRef.current,
  };
};
