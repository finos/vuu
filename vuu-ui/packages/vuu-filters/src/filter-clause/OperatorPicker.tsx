import type { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  ExpandoComboboxSalt,
  ExpandoComboboxSaltProps,
} from "./ExpandoComboboxSalt";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { FilterClauseOp } from "packages/vuu-filter-types";
import { getOperators } from "./operator-utils";
import { isValidFilterClauseOp } from "@finos/vuu-utils";

export type OperatorPickerProps = Pick<
  ExpandoComboboxSaltProps,
  "className" | "inputProps" | "value"
> & {
  column: ColumnDescriptor;
  onSelect: (evt: SyntheticEvent, operator: FilterClauseOp) => void;
};

export const OperatorPicker = forwardRef(function ColumnPicker(
  { className, column, inputProps, onSelect, value }: OperatorPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const handleSelectionChange = (
    evt: SyntheticEvent,
    newSelected: string[]
  ) => {
    const [selectedValue] = newSelected;
    if (isValidFilterClauseOp(selectedValue)) {
      onSelect(evt, selectedValue);
    }
  };

  return (
    <ExpandoComboboxSalt
      inputProps={inputProps}
      className={className}
      data-field="operator"
      onSelectionChange={handleSelectionChange}
      ref={forwardedRef}
      title="operator"
      value={value}
      values={getOperators(column)}
    />
  );
});
