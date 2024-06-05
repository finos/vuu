import type { FilterClauseOp } from "@finos/vuu-filter-types";
import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { isValidFilterClauseOp } from "@finos/vuu-utils";
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
    <ExpandoCombobox
      inputProps={inputProps}
      className={className}
      data-field="operator"
      onSelectionChange={handleSelectionChange}
      ref={forwardedRef}
      title="operator"
      value={value}
    >
      {getOperators(column).map((op) => (
        <Option value={op} key={op} />
      ))}
    </ExpandoCombobox>
  );
});
