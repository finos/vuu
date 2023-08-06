import { getColumnByName, TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause } from "@finos/vuu-filter-types";
import cx from "classnames";
import {
  HTMLAttributes,
  SyntheticEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { CloseButton } from "./CloseButton";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { NumericInput } from "./NumericInput";
import { textOperators } from "./operator-utils";
import { TextInput } from "./TextInput";

import "./FilterClauseEditor.css";

export interface FilterClauseEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  filterClause: Partial<FilterClause>;
  onChange: (filterClause: Partial<FilterClause>) => void;
  onClose: () => void;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClauseEditor = ({
  onChange,
  onClose,
  filterClause,
  tableSchema,
  ...htmlAttributes
}: FilterClauseEditorProps) => {
  const { table, columns } = tableSchema;
  const operatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const [selectedColumn, setSelectedColumn] = useState<
    ColumnDescriptor | undefined
  >(getColumnByName(tableSchema, filterClause.column));
  const [operator, setOperator] = useState<string | undefined>(filterClause.op);
  const [value, setValue] = useState<unknown | undefined>(filterClause.value);

  const handleColumnSelectionChange = useCallback(
    (evt: SyntheticEvent, column: ColumnDescriptor | null) => {
      setSelectedColumn(column ?? undefined);
    },
    []
  );
  const handleOperatorSelectionChange = useCallback(
    (evt: SyntheticEvent, operator: string | null) => {
      setOperator(operator ?? undefined);
    },
    []
  );

  const handleValueChange = useCallback(
    (value: string) => {
      console.log(`handleValueChange ${value}`);
      setValue(value);
      onChange({
        column: selectedColumn?.name,
        op: operator,
        value,
      });
    },
    [onChange, operator, selectedColumn?.name]
  );

  useEffect(() => {
    if (
      selectedColumn !== undefined &&
      operator === undefined &&
      operatorRef.current
    ) {
      const operatorInput = operatorRef.current.querySelector("input");
      operatorInput?.focus();
    }
  }, [operator, selectedColumn]);

  useEffect(() => {
    if (operator !== undefined && value === undefined && valueRef.current) {
      console.log(`Looks like operator has changed, is now ${operator}`);
      const valueInput = valueRef.current.querySelector("input");
      valueInput?.focus();
    }
  }, [operator, value]);

  const getInputElement = useCallback(() => {
    if (selectedColumn === null || operator === undefined) {
      return null;
    }
    switch (selectedColumn?.serverDataType) {
      case "string":
      case "char":
        return (
          <TextInput
            className={classBase}
            column={selectedColumn}
            filterClause={filterClause}
            onValueChange={handleValueChange}
            operator={operator}
            ref={valueRef}
            table={table}
            value={value as string}
          />
        );
      case "int":
      case "long":
      case "double":
        console.log("returning numeric input");
        return (
          <NumericInput
            className={classBase}
            column={selectedColumn}
            filterClause={filterClause}
            operator={operator}
            ref={valueRef}
          />
        );
      case undefined:
        console.log("returning undefined");
        return undefined;
      default:
        console.log("returning unsupported");
        return null;
    }
  }, [selectedColumn, operator, filterClause, handleValueChange, table, value]);

  return (
    <div className={classBase} {...htmlAttributes} tabIndex={0}>
      <ExpandoCombobox<ColumnDescriptor>
        itemToString={(column) => column.name}
        source={columns}
        onSelectionChange={handleColumnSelectionChange}
        value={selectedColumn?.name ?? ""}
      />
      <ExpandoCombobox<string>
        className={cx(`${classBase}-operator`, {
          [`${classBase}-operator-hidden`]: selectedColumn === null,
        })}
        ref={operatorRef}
        source={textOperators}
        onSelectionChange={handleOperatorSelectionChange}
        value={operator ?? ""}
      />
      {getInputElement()}
      <CloseButton classBase={`${classBase}-closeButton`} onClick={onClose} />
    </div>
  );
};
