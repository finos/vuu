import type { FilterClauseOp } from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ComboBoxProps, Option, useForkRef } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { getOperators } from "./operator-utils";
import { useOperatorPicker } from "./useOperatorPicker";

export type OperatorPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  column: ColumnDescriptor;
  onSelect: (evt: SyntheticEvent, operator: FilterClauseOp) => void;
  dropdownOnAutofocus?: boolean;
};

export const OperatorPicker = forwardRef(function OperatorPicker(
  {
    className,
    column,
    dropdownOnAutofocus = true,
    inputProps,
    onSelect,
    value: valueProp,
  }: OperatorPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const { ref, ...comboProps } = useOperatorPicker({
    onSelect,
    value: valueProp?.toString() ?? "",
  });

  return (
    <ExpandoCombobox<FilterClauseOp>
      {...comboProps}
      className={className}
      data-field="operator"
      dropdownOnAutofocus={dropdownOnAutofocus}
      inputProps={inputProps}
      ref={useForkRef(forwardedRef, ref)}
      title="operator"
    >
      {getOperators(column)
        .filter((op) =>
          op.toLowerCase().includes(comboProps.value.toLowerCase()),
        )
        .map((op) => (
          <Option value={op} key={op} />
        ))}
    </ExpandoCombobox>
  );
});
