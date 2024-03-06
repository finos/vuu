import { SuggestionFetcher, TableSchema } from "@finos/vuu-data-types";
import { ColumnDescriptorsByName, FilterClause } from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { Button } from "@salt-ds/core";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { getOperators } from "./operator-utils";
import { FilterClauseValueEditor } from "./FilterClauseValueEditor";
import {
  FilterClauseCancelHandler,
  useFilterClauseEditor,
} from "./useFilterClauseEditor";

import "./FilterClauseEditor.css";

export interface FilterClauseEditorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnsByName: ColumnDescriptorsByName;
  filterClause: Partial<FilterClause>;
  onCancel?: FilterClauseCancelHandler;
  onChange: (filterClause: Partial<FilterClause>) => void;
  onDropdownClose?: (closeReason: CloseReason) => void;
  onDropdownOpen?: () => void;
  suggestionProvider?: () => SuggestionFetcher;
  tableSchema?: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClauseEditor = ({
  className,
  columnsByName,
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
    columnsByName,
  });

  const columns = useMemo(() => Object.values(columnsByName), [columnsByName]);

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
      <FilterClauseValueEditor
        InputProps={InputProps}
        onChangeValue={onChangeValue}
        onDeselectValue={onDeselectValue}
        operator={operator}
        selectedColumn={selectedColumn}
        suggestionProvider={suggestionProvider}
        table={tableSchema?.table}
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
