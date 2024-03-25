import { SuggestionFetcher, TableSchema } from "@finos/vuu-data-types";
import {
  ColumnDescriptorsByName,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@finos/vuu-filter-types";
import { ColumnDescriptor } from "@finos/vuu-table-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { FilterClauseModel } from "../FilterModel";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { FilterClauseValueEditor } from "./value-editors/FilterClauseValueEditor";
import { getOperators } from "./operator-utils";
import { useFilterClause } from "./useFilterClause";

import "./FilterClause.css";

export type FilterClauseCancelType = "Backspace" | "Escape";
export type FilterClauseCancelHandler = (
  filterClause: FilterClauseModel,
  reason: FilterClauseCancelType
) => void;

export interface FilterClauseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnsByName: ColumnDescriptorsByName;
  filterClauseModel: FilterClauseModel;
  onCancel?: FilterClauseCancelHandler;
  onDropdownClose?: (closeReason: CloseReason) => void;
  onDropdownOpen?: () => void;
  suggestionProvider?: () => SuggestionFetcher;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClause = ({
  className,
  columnsByName,
  onCancel,
  onDropdownClose,
  onDropdownOpen,
  filterClauseModel,
  suggestionProvider,
  tableSchema,
  ...htmlAttributes
}: FilterClauseProps) => {
  const {
    InputProps,
    columnRef,
    filterClause,
    onChangeValue,
    onColumnSelect,
    onFocus,
    onDeselectValue,
    onOperatorSelect,
    operatorRef,
    selectedColumn,
  } = useFilterClause({
    filterClauseModel,
    onCancel,
    columnsByName,
  });

  const columns = useMemo(() => Object.values(columnsByName), [columnsByName]);

  return (
    <div
      className={cx(classBase, className)}
      {...htmlAttributes}
      onFocus={onFocus}
      tabIndex={0}
    >
      <ExpandoCombobox<ColumnDescriptor>
        InputProps={InputProps}
        allowBackspaceClearsSelection
        className={cx(`${classBase}Field`, `${classBase}Column`)}
        data-field="column"
        key="column-field"
        initialHighlightedIndex={0}
        itemToString={(column) => (column as ColumnDescriptor).name}
        onListItemSelect={onColumnSelect}
        ref={columnRef}
        source={columns}
        title="column"
        value={filterClause.column}
      />
      {selectedColumn?.name ? (
        <ExpandoCombobox<string>
          InputProps={InputProps}
          allowBackspaceClearsSelection
          className={cx(`${classBase}Field`, `${classBase}Operator`, {
            [`${classBase}Operator-hidden`]: selectedColumn === null,
          })}
          data-field="operator"
          key="operator-field"
          initialHighlightedIndex={0}
          onListItemSelect={onOperatorSelect}
          ref={operatorRef}
          source={getOperators(selectedColumn)}
          title="operator"
          value={filterClause.op ?? ""}
        />
      ) : null}
      <FilterClauseValueEditor
        InputProps={InputProps}
        key="value-field"
        onChangeValue={onChangeValue}
        onDeselectValue={onDeselectValue}
        operator={filterClause.op}
        selectedColumn={selectedColumn}
        suggestionProvider={suggestionProvider}
        table={tableSchema.table}
        value={
          (filterClause as MultiValueFilterClause)?.values ??
          (filterClause as SingleValueFilterClause)?.value
        }
      />
    </div>
  );
};
