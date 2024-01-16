import { SuggestionFetcher } from "@finos/vuu-data-react";
import { TableSchema } from "@finos/vuu-data-types";
import { FilterClause } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useCallback } from "react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { NumericInput } from "./NumericInput";
import { getOperators } from "./operator-utils";
import { TextInput } from "./TextInput";
import {
  FilterClauseCancelHandler,
  useFilterClauseEditor,
} from "./useFilterClauseEditor";

import "./FilterClauseEditor.css";

export interface FilterClauseEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  filterClause: Partial<FilterClause>;
  onCancel?: FilterClauseCancelHandler;
  onChange: (filterClause: Partial<FilterClause>) => void;
  onDropdownClose?: (closeReason: CloseReason) => void;
  onDropdownOpen?: () => void;
  suggestionProvider?: () => SuggestionFetcher;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClauseEditor = ({
  className,
  onCancel,
  onChange,
  onDropdownClose,
  onDropdownOpen,
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
    onClear,
    onClearKeyDown,
    onDeselectValue,
    onColumnSelect,
    onOperatorSelect,
    operator,
    operatorRef,
    selectedColumn,
    value,
    valueRef,
  } = useFilterClauseEditor({
    filterClause,
    onCancel,
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
            data-field="value"
            filterClause={filterClause}
            onDeselect={onDeselectValue}
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
    onDeselectValue,
    onChangeValue,
    valueRef,
    suggestionProvider,
    table,
    value,
  ]);

  return (
    <div className={cx(classBase, className)} {...htmlAttributes} tabIndex={0}>
      <ExpandoCombobox<ColumnDescriptor>
        InputProps={InputProps}
        allowBackspaceClearsSelection
        className={cx(`${classBase}Field`, `${classBase}Column`)}
        data-field="column"
        initialHighlightedIndex={0}
        itemToString={(column) => column.name}
        onListItemSelect={onColumnSelect}
        ref={columnRef}
        source={columns}
        title="column"
        value={selectedColumn?.name ?? ""}
      />
      {selectedColumn?.name ? (
        <ExpandoCombobox<string>
          InputProps={InputProps}
          allowBackspaceClearsSelection
          className={cx(`${classBase}Field`, `${classBase}Operator`, {
            [`${classBase}Operator-hidden`]: selectedColumn === null,
          })}
          data-field="operator"
          initialHighlightedIndex={0}
          onListItemSelect={onOperatorSelect}
          ref={operatorRef}
          source={getOperators(selectedColumn)}
          title="operator"
          value={operator ?? ""}
        />
      ) : null}
      {getInputElement()}
      {value !== undefined ? (
        <Button
          className={`${classBase}-clearButton`}
          onClick={onClear}
          onKeyDown={onClearKeyDown}
          data-icon="close"
        />
      ) : null}
    </div>
  );
};
