import { TableSchema } from "@finos/vuu-data";
import { SuggestionFetcher } from "@finos/vuu-data-react";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { FilterClause } from "@finos/vuu-filter-types";
import cx from "classnames";
import { HTMLAttributes, useCallback } from "react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { NumericInput } from "./NumericInput";
import { getOperators } from "./operator-utils";
import { TextInput } from "./TextInput";
import { useFilterClauseEditor } from "./useFilterClauseEditor";

import "./FilterClauseEditor.css";
import { Button } from "@salt-ds/core";

export interface FilterClauseEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  filterClause: Partial<FilterClause>;
  onChange: (filterClause: Partial<FilterClause>) => void;
  onClose: () => void;
  suggestionProvider?: () => SuggestionFetcher;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClauseEditor = ({
  className,
  onChange,
  onClose,
  filterClause,
  suggestionProvider,
  tableSchema,
  ...htmlAttributes
}: FilterClauseEditorProps) => {
  const { table, columns } = tableSchema;

  const {
    InputProps,
    columnRef,
    onChangeValue,
    onSelectionChangeColumn,
    onSelectionChangeOperator,
    operator,
    operatorRef,
    selectedColumn,
    value,
    valueRef,
  } = useFilterClauseEditor({
    filterClause,
    onChange,
    tableSchema,
  });

  const getInputElement = useCallback(() => {
    if (selectedColumn === null || operator === undefined) {
      return null;
    }
    switch (selectedColumn?.serverDataType) {
      case "string":
      case "char":
        return (
          <TextInput
            InputProps={InputProps}
            className={cx(`${classBase}Field`, `${classBase}Value`)}
            column={selectedColumn}
            filterClause={filterClause}
            onInputComplete={onChangeValue}
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
        return (
          <NumericInput
            InputProps={InputProps}
            className={cx(`${classBase}Field`, `${classBase}Value`)}
            column={selectedColumn}
            filterClause={filterClause}
            onInputComplete={onChangeValue}
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
    InputProps,
    filterClause,
    onChangeValue,
    valueRef,
    suggestionProvider,
    table,
    value,
  ]);

  return (
    <div className={cx(classBase, className)} {...htmlAttributes} tabIndex={0}>
      <ExpandoCombobox<ColumnDescriptor>
        title="column"
        InputProps={InputProps}
        className={cx(`${classBase}Field`, `${classBase}Column`)}
        initialHighlightedIndex={0}
        itemToString={(column) => column.name}
        ref={columnRef}
        source={columns}
        onSelectionChange={onSelectionChangeColumn}
        value={selectedColumn?.name ?? ""}
      />
      {selectedColumn?.name ? (
        <ExpandoCombobox<string>
          title="operator"
          InputProps={InputProps}
          className={cx(`${classBase}Field`, `${classBase}Operator`, {
            [`${classBase}Operator-hidden`]: selectedColumn === null,
          })}
          initialHighlightedIndex={0}
          ref={operatorRef}
          source={getOperators(selectedColumn)}
          onSelectionChange={onSelectionChangeOperator}
          value={operator ?? ""}
        />
      ) : null}
      {getInputElement()}
      {value !== undefined ? (
        <Button
          className={`${classBase}-closeButton`}
          onClick={onClose}
          data-icon="close"
        />
      ) : null}
    </div>
  );
};
