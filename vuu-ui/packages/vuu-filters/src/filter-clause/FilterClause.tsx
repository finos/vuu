import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  Filter,
  FilterClause as FilterClauseType,
} from "@finos/vuu-filter-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { ComboBox } from "@salt-ds/lab";
import { HTMLAttributes, useCallback, useRef, useState } from "react";
import { CloseButton } from "./CloseButton";
import { NumericInput } from "./NumericInput";
import { TextInput } from "./TextInput";

import "./FilterClause.css";

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

const classBase = "vuuFilterClause";

export const FilterClause = ({
  table,
  onChange,
  onClose,
  columns,
  defaultFilter,
  ...htmlAttributes
}: FilterClauseProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [columnInputValue, setColumnInputValue] = useState("");
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
          ListProps={{
            displayedItemCount: 10,
            width: 200,
          }}
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
          getFilterRegex={selectedColumn && (() => /.*/)}
          data-text="hello"
        />
      {getInputElement()}
      <CloseButton classBase={`${classBase}-closeButton`} onClick={onClose} />
    </div>
  );
};
