import { HTMLAttributes, useCallback, useRef, useState } from "react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  Filter,
  FilterClause as FilterClauseType,
} from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { ComboBox } from "@heswell/salt-lab";
import { TextInput } from "./TextInput";
import { NumericInput } from "./NumericInput";

export type FilterClauseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  table: VuuTable;
  onChange: (filter?: Filter | undefined) => void;
  columns: ColumnDescriptor[];
  defaultFilter?: FilterClauseType;
};

export const FilterClause = ({
  table,
  onChange,
  columns,
  defaultFilter,
  ...htmlAttributes
}: FilterClauseProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedColumn, setSelectedColumn] = useState<ColumnDescriptor>();

  const getInputElement = useCallback(() => {
    console.log("selecting input", selectedColumn?.serverDataType);
    switch (selectedColumn?.serverDataType) {
      case "string":
      case "char":
        console.log("returning text input");
        return (
          <TextInput
            table={table}
            column={selectedColumn.name}
            operatorInputRef={inputRef}
            onFilterChange={onChange}
            defaultFilter={defaultFilter}
          />
        );
      case "int":
      case "long":
      case "double":
        console.log("returning numeric input");
        return (
          <NumericInput
            column={selectedColumn.name}
            operatorInputRef={inputRef}
            onFilterChange={onChange}
            defaultFilter={defaultFilter}
          />
        );
      case undefined:
        console.log("returning undefined");
        return undefined;
      default:
        console.log("returning unsupported");
        return <p>Data type unsupported</p>;
    }
  }, [
    selectedColumn?.serverDataType,
    selectedColumn?.name,
    table,
    onChange,
    defaultFilter,
  ]);

  return (
    <div
      style={{
        display: "flex",
        minWidth: 10,
        width: "fit-content",
        border: "5px solid lawngreen",
      }}
      {...htmlAttributes}
    >
      <ComboBox<ColumnDescriptor, "deselectable">
        style={{ backgroundColor: "red" }}
        source={columns}
        itemToString={(column) => column.name}
        InputProps={{ highlightOnFocus: true }}
        onSelectionChange={(_event, selectedColumn) => {
          console.log("setting selected column", selectedColumn);
          setSelectedColumn(selectedColumn || undefined);
          setTimeout(() => {
            inputRef.current?.querySelector("input")?.focus();
          }, 300);
        }}
        selectionStrategy="deselectable"
      />
      {getInputElement()}
    </div>
  );
};
