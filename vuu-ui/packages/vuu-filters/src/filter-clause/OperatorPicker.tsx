import type { FilterClauseOp } from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { isValidFilterClauseOp } from "@vuu-ui/vuu-utils";
import { ComboBoxProps, Option } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { getOperators } from "./operator-utils";

export type OperatorPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  column: ColumnDescriptor;
  onSelect: (evt: SyntheticEvent, operator: FilterClauseOp) => void;
  dropdownOnAutofocus?: boolean;
};

export const OperatorPicker = forwardRef(function ColumnPicker(
  { className, column, inputProps, onSelect, value, dropdownOnAutofocus = true }: OperatorPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const handleSelectionChange = (
    evt: SyntheticEvent,
    newSelected: string[],
  ) => {
    const [selectedValue] = newSelected;
    if (isValidFilterClauseOp(selectedValue)) {
      onSelect(evt, selectedValue);
    }
  };

  return (
    <ExpandoCombobox
      inputProps={inputProps}
      className={className}
      data-field="operator"
      onSelectionChange={handleSelectionChange}
      ref={forwardedRef}
      title="operator"
      value={value}
      dropdownOnAutofocus={dropdownOnAutofocus}
    >
      {getOperators(column).map((op) => (
        <Option value={op} key={op} />
      ))}
    </ExpandoCombobox>
  );
});
