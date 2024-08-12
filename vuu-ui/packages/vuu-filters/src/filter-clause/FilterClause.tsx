import type { SuggestionProvider, TableSchema } from "@finos/vuu-data-types";
import {
  ColumnDescriptorsByName,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@finos/vuu-filter-types";
import { CloseReason } from "@finos/vuu-ui-controls";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { FilterClauseModel } from "../FilterModel";
import { useFilterClause } from "./useFilterClause";
import { FilterClauseValueEditor } from "./value-editors/FilterClauseValueEditor";
import { ColumnPicker } from "./ColumnPicker";

import filterClauseCss from "./FilterClause.css";
import { OperatorPicker } from "./OperatorPicker";

export type FilterClauseCancelType = "Backspace" | "Escape";
export type FilterClauseCancelHandler = (
  filterClause: FilterClauseModel,
  reason: FilterClauseCancelType,
) => void;

export interface FilterClauseProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  columnsByName: ColumnDescriptorsByName;
  filterClauseModel: FilterClauseModel;
  onCancel?: FilterClauseCancelHandler;
  onDropdownClose?: (closeReason: CloseReason) => void;
  onDropdownOpen?: () => void;
  onFocusSave?: () => void;
  suggestionProvider?: SuggestionProvider;
  tableSchema: TableSchema;
}

const classBase = "vuuFilterClause";

export const FilterClause = ({
  className,
  columnsByName,
  onCancel,
  onDropdownClose,
  onDropdownOpen,
  onFocusSave,
  filterClauseModel,
  suggestionProvider,
  tableSchema,
  ...htmlAttributes
}: FilterClauseProps) => {
  const {
    inputProps,
    columnRef,
    filterClause,
    onChangeValue,
    onSelectColumn,
    onSelectOperator,
    onDeselectValue,
    operatorRef,
    selectedColumn,
    valueRef,
  } = useFilterClause({
    filterClauseModel,
    onCancel,
    onFocusSave,
    columnsByName,
  });

  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-filter-clause",
    css: filterClauseCss,
    window: targetWindow,
  });

  const columns = useMemo(() => Object.values(columnsByName), [columnsByName]);

  return (
    <div className={cx(classBase, className)} {...htmlAttributes} tabIndex={0}>
      <ColumnPicker
        inputProps={inputProps}
        className={cx(`${classBase}Field`, `${classBase}Column`)}
        columns={columns}
        key="column-field"
        onSelect={onSelectColumn}
        ref={columnRef}
        value={filterClauseModel.column ?? ""}
      />
      {selectedColumn?.name ? (
        <OperatorPicker
          column={selectedColumn}
          inputProps={inputProps}
          className={cx(`${classBase}Field`, `${classBase}Operator`, {
            [`${classBase}Operator-hidden`]: selectedColumn === null,
          })}
          key="operator-field"
          onSelect={onSelectOperator}
          ref={operatorRef}
          value={filterClauseModel.op ?? ""}
        />
      ) : null}
      {filterClauseModel.op ? (
        <FilterClauseValueEditor
          inputProps={inputProps}
          key="value-field"
          onChangeValue={onChangeValue}
          onDeselectValue={onDeselectValue}
          operator={filterClauseModel.op}
          ref={valueRef}
          selectedColumn={selectedColumn}
          suggestionProvider={suggestionProvider}
          table={tableSchema.table}
          value={
            (filterClause as MultiValueFilterClause)?.values ??
            (filterClause as SingleValueFilterClause)?.value
          }
        />
      ) : null}
    </div>
  );
};
