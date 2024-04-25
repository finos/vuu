import { DataSourceRowObject, TableSchema } from "@finos/vuu-data-types";
import { Table, TableProps } from "@finos/vuu-table";
import { ColumnMap, useId } from "@finos/vuu-utils";
import { Input } from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ForwardedRef, forwardRef, HTMLAttributes, useMemo } from "react";
import { DropdownBase, OpenChangeHandler } from "../dropdown";
import { SearchCell } from "./SearchCell";
import { useInstrumentPicker } from "./useInstrumentPicker";

import instrumentPickerCss from "./InstrumentPicker.css";

const classBase = "vuuInstrumentPicker";

if (typeof SearchCell !== "function") {
  console.warn("Instrument Picker: SearchCell module not loaded ");
}

export interface InstrumentPickerProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect">,
    Pick<TableProps, "onSelect"> {
  TableProps: Pick<TableProps, "config" | "dataSource">;
  columnMap: ColumnMap;
  disabled?: boolean;
  /**
   * Used to form the display value to render in input following selection. If
   * not provided, default will be the values from rendered columns.
   *
   * @param row DataSourceRow
   * @returns string
   */
  itemToString?: (row: DataSourceRowObject) => string;
  onClose?: () => void;
  onOpenChange?: OpenChangeHandler;
  schema: TableSchema;
  searchColumns: string[];
  width?: number;
}

export const InstrumentPicker = forwardRef(function InstrumentPicker(
  {
    TableProps: { dataSource, ...TableProps },
    className,
    columnMap,
    disabled,
    id: idProp,
    itemToString,
    onOpenChange: onOpenChangeProp,
    onSelect,
    schema,
    searchColumns,
    width,
    ...htmlAttributes
  }: InstrumentPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-instrument-picker",
    css: instrumentPickerCss,
    window: targetWindow,
  });

  const id = useId(idProp);

  const {
    highlightedIndex,
    inputProps,
    isOpen,
    onOpenChange,
    tableHandlers,
    tableRef,
    value,
  } = useInstrumentPicker({
    columnMap,
    columns: TableProps.config.columns,
    dataSource,
    itemToString,
    onOpenChange: onOpenChangeProp,
    onSelect,
    searchColumns,
  });

  const endAdornment = useMemo(() => <span data-icon="chevron-down" />, []);

  const tableProps = {
    ...TableProps,
    config: {
      ...TableProps.config,
      zebraStripes: false,
    },
  };

  return (
    <DropdownBase
      {...htmlAttributes}
      fullWidth
      id={id}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      openOnFocus
      placement="below-full-width"
      ref={forwardedRef}
      width={width}
    >
      <Input
        {...inputProps}
        disabled={disabled}
        endAdornment={endAdornment}
        value={value}
      />

      <Table
        rowHeight={25}
        renderBufferSize={100}
        {...tableProps}
        {...tableHandlers}
        className={`${classBase}-list`}
        height={200}
        highlightedIndex={highlightedIndex}
        dataSource={dataSource}
        navigationStyle="row"
        ref={tableRef}
        showColumnHeaders={false}
      />
    </DropdownBase>
  );
});
