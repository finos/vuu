import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  ColumnDescriptorsByName,
  MultiValueFilterClause,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import cx from "clsx";
import { HTMLAttributes, useMemo } from "react";
import { FilterClauseModel } from "../FilterModel";
import { ColumnPicker } from "./column-picker/ColumnPicker";
import { useFilterClause } from "./useFilterClause";
import { FilterClauseValueEditor } from "./value-editors/FilterClauseValueEditor";

import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import filterClauseCss from "./FilterClause.css";
import { OperatorPicker } from "./operator-picker/OperatorPicker";

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
  onDropdownOpen?: () => void;
  onFocusSave?: () => void;
  dropdownOnAutofocus?: boolean;
  vuuTable: VuuTable;
}

const classBase = "vuuFilterClause";

export const FilterClause = ({
  className,
  columnsByName,
  onCancel,
  onDropdownOpen,
  onFocusSave,
  filterClauseModel,
  vuuTable,
  dropdownOnAutofocus = true,
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
    onOpenChange,
    operatorRef,
    selectedColumn,
    valueRef,
    showDropdownOnAutoFocus,
  } = useFilterClause({
    filterClauseModel,
    onCancel,
    onFocusSave,
    columnsByName,
    dropdownOnAutofocus,
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
        dropdownOnAutofocus={showDropdownOnAutoFocus}
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
          dropdownOnAutofocus={showDropdownOnAutoFocus}
          key="operator-field"
          onSelect={onSelectOperator}
          ref={operatorRef}
          value={filterClauseModel.op ?? ""}
        />
      ) : null}
      {filterClauseModel.op ? (
        <FilterClauseValueEditor
          dropdownOnAutofocus={showDropdownOnAutoFocus}
          inputProps={inputProps}
          key="value-field"
          onChangeValue={onChangeValue}
          onOpenChange={onOpenChange}
          onDeselectValue={onDeselectValue}
          operator={filterClauseModel.op}
          ref={valueRef}
          selectedColumn={selectedColumn}
          table={vuuTable}
          value={
            (filterClause as MultiValueFilterClause)?.values ??
            (filterClause as SingleValueFilterClause)?.value
          }
        />
      ) : null}
    </div>
  );
};
