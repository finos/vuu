import { getColumnByName, TableSchema } from "@finos/vuu-data";
import { SuggestionFetcher } from "@finos/vuu-data-react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause, FilterClauseOp } from "@finos/vuu-filter-types";
import {
  isMultiValueFilter,
  isSingleValueFilter,
  isValidFilterClauseOp,
} from "@finos/vuu-utils";
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
  suggestionProvider?: () => SuggestionFetcher;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

// TODO boolean[] makes no sense
type FilterClauseValue =
  | boolean
  | boolean[]
  | string
  | string[]
  | number
  | number[];

const getFilterClauseValue = (
  filterClause: Partial<FilterClause>
): FilterClauseValue | undefined => {
  if (isMultiValueFilter(filterClause)) {
    return filterClause.values;
  } else if (isSingleValueFilter(filterClause)) {
    return filterClause.value;
  } else {
    return undefined;
  }
};

export const FilterClauseEditor = ({
  onChange,
  onClose,
  filterClause,
  suggestionProvider,
  tableSchema,
  ...htmlAttributes
}: FilterClauseEditorProps) => {
  const { table, columns } = tableSchema;
  const operatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const [selectedColumn, setSelectedColumn] = useState<
    ColumnDescriptor | undefined
  >(getColumnByName(tableSchema, filterClause.column));
  const [operator, setOperator] = useState<FilterClauseOp | undefined>(
    filterClause.op
  );
  const [value, setValue] = useState<FilterClauseValue | undefined>(
    getFilterClauseValue(filterClause)
  );

  const handleColumnSelectionChange = useCallback(
    (evt: SyntheticEvent, column: ColumnDescriptor | null) => {
      setSelectedColumn(column ?? undefined);
    },
    []
  );
  const handleOperatorSelectionChange = useCallback(
    (evt: SyntheticEvent, operator: string | null) => {
      const op = operator ?? undefined;
      if (op === undefined || isValidFilterClauseOp(op)) {
        setOperator(op);
      } else {
        throw Error(
          `FilterClauseEditor, invalid value ${op} for filter clause`
        );
      }
    },
    []
  );

  const handleValueChange = useCallback(
    (value: string | number) => {
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
            suggestionProvider={suggestionProvider}
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
            onValueChange={handleValueChange}
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
  }, [
    selectedColumn,
    operator,
    filterClause,
    handleValueChange,
    suggestionProvider,
    table,
    value,
  ]);

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
