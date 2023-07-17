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
import "./FilterClause.css";
import { CloseButton } from "./CloseButton";

export type FilterClauseProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> & {
  table: VuuTable;
  onChange: (filter?: Filter) => void;
  onClose: () => void;
  columns: ColumnDescriptor[];
  defaultFilter?: FilterClauseType;
};

// Hack to get vuu-purple-theme to apply to dropdowns
const classBase = "vuu-purple-theme vuuFilterClause";

export const FilterClause = ({
  table,
  onChange,
  onClose,
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
            className={classBase}
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
            className={classBase}
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
    <div className={classBase} {...htmlAttributes} tabIndex={0}>
      <ComboBox<ColumnDescriptor, "deselectable">
        className={`${classBase}-columnSelector`}
        source={columns}
        itemToString={(column) => column.name}
        InputProps={{
          highlightOnFocus: true,
          inputProps: { autoComplete: "off" },
        }}
        onSelectionChange={(_event, selectedColumn) => {
          setSelectedColumn(selectedColumn || undefined);
          if (!selectedColumn) return;
          setTimeout(() => {
            inputRef.current?.querySelector("input")?.focus();
          }, 300);
        }}
        selectionStrategy="deselectable"
      />
      {getInputElement()}
      <CloseButton classBase={classBase} onClick={onClose} />
    </div>
  );
};
