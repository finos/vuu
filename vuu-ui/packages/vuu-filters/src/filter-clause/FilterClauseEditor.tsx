import { SuggestionFetcher } from "@finos/vuu-data-react";
import { TableSchema } from "@finos/vuu-data-types";
import { FilterClause } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { getOperators } from "./operator-utils";
import { InputElement } from "./InputElement";
import {
  FilterClauseCancelHandler,
  useFilterClauseEditor,
} from "./useFilterClauseEditor";

import "./FilterClauseEditor.css";

export interface FilterClauseEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnDescriptors: Record<string, ColumnDescriptor>;
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
  columnDescriptors,
  onCancel,
  onChange,
  onDropdownClose,
  onDropdownOpen,
  filterClause,
  suggestionProvider,
  tableSchema,
  ...htmlAttributes
}: FilterClauseEditorProps) => {
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
  } = useFilterClauseEditor({
    filterClause,
    onCancel,
    onChange,
    columnDescriptors,
  });

  const columns = useMemo(
    () => Object.values(columnDescriptors),
    [columnDescriptors]
  );

  return (
    <div className={cx(classBase, className)} {...htmlAttributes} tabIndex={0}>
      <ExpandoCombobox<ColumnDescriptor>
        InputProps={InputProps}
        allowBackspaceClearsSelection
        className={cx(`${classBase}Field`, `${classBase}Column`)}
        data-field="column"
        initialHighlightedIndex={0}
        itemToString={(column) => (column as ColumnDescriptor).name}
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
      <InputElement
        InputProps={InputProps}
        onChangeValue={onChangeValue}
        onDeselectValue={onDeselectValue}
        operator={operator}
        selectedColumn={selectedColumn}
        suggestionProvider={suggestionProvider}
        table={tableSchema.table}
        value={value}
      />
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
