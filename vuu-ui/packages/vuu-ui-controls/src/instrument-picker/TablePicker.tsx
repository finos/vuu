import type { DataSourceRowObject, TableSchema } from "@vuu-ui/vuu-data-types";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import {
  Input,
  useFloatingComponent,
  useIdMemo,
  type FloatingComponentProps,
} from "@salt-ds/core";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { forwardRef, useMemo, type HTMLAttributes } from "react";
import { IconButton } from "../icon-button";
import tablePickerCss from "./TablePicker.css";
import { useTablePicker } from "./useTablePicker";

const classBase = "vuuTablePicker";

interface FloatingTableProps extends FloatingComponentProps {
  collapsed?: boolean;
}

export interface TablePickerProps
  extends Omit<HTMLAttributes<HTMLElement>, "onSelect">,
    Pick<TableProps, "onSelect"> {
  TableProps?: Pick<TableProps, "config">;
  rowToString?: (row: DataSourceRowObject) => string;
  schema: TableSchema;
  searchColumns?: string[];
}

const FloatingTable = forwardRef<HTMLDivElement, FloatingTableProps>(
  function FloatingTable(
    { children, className, collapsed, open, ...props },
    forwardedRef,
  ) {
    const { Component: FloatingComponent } = useFloatingComponent();
    return (
      <FloatingComponent
        className={cx(
          `${classBase}-floating-table`,
          {
            [`${classBase}-collapsed`]: collapsed,
          },
          className,
        )}
        role="listbox"
        open={open}
        {...props}
        ref={forwardedRef}
      >
        {children}
      </FloatingComponent>
    );
  },
);

export const TablePicker = ({
  TableProps,
  onSelect,
  rowToString,
  schema,
  searchColumns,
  ...htmlAttributes
}: TablePickerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-table-picker",
    css: tablePickerCss,
    window: targetWindow,
  });

  const tableId = useIdMemo();

  const {
    containerRef,
    dataSource,
    highlightedIndex,
    floatingUIProps: { x, y, strategy, floating, reference },
    inputProps,
    interactionPropGetters: { getFloatingProps, getReferenceProps },
    onKeyDown,
    open,
    tableConfig,
    tableHandlers,
    tableRef,
    value,
    width,
  } = useTablePicker({
    TableProps,
    rowToString,
    onSelect,
    schema,
    searchColumns,
  });

  const endAdornment = useMemo(
    () => (
      <IconButton
        {...getReferenceProps()}
        appearance="transparent"
        data-embedded
        ref={reference}
        icon="chevron-down"
        onKeyDown={onKeyDown}
        sentiment="neutral"
      />
    ),
    [getReferenceProps, onKeyDown, reference],
  );

  return (
    <div {...htmlAttributes} className={classBase} ref={containerRef}>
      <Input
        {...inputProps}
        bordered
        endAdornment={endAdornment}
        value={value}
      />
      <FloatingTable
        {...getFloatingProps()}
        collapsed={!open}
        id={tableId}
        open={open}
        left={x + 3}
        position={strategy}
        ref={floating}
        top={y + 3}
      >
        <Table
          {...tableHandlers}
          config={tableConfig}
          dataSource={dataSource}
          highlightedIndex={highlightedIndex}
          maxViewportRowLimit={10}
          navigationStyle="row"
          ref={tableRef}
          selectionModel="single"
          showColumnHeaders={false}
          width={width - 3}
        />
      </FloatingTable>
    </div>
  );
};
