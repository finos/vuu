import type { ColumnFilterOp, FilterClauseOp } from "@vuu-ui/vuu-filter-types";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ComboBoxProps, Dropdown, Option, useForkRef } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { getOperators } from "./operator-utils";
import { useOperatorPicker } from "./useOperatorPicker";

type OperatorComboboxProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  column: ColumnDescriptor;
  onSelect: (evt: SyntheticEvent, operator: FilterClauseOp) => void;
  dropdownOnAutofocus?: boolean;
  variant?: "combobox";
  operators?: readonly FilterClauseOp[];
};

type OperatorDropdownProps = {
  variant: "dropdown";
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  operators: readonly ColumnFilterOp[];
  value: ColumnFilterOp;
  onSelect: (evt: SyntheticEvent, operator: ColumnFilterOp) => void;
  "aria-label"?: string;
};

export type OperatorPickerProps = OperatorComboboxProps | OperatorDropdownProps;

export const OperatorPicker = forwardRef(function OperatorPicker(
  props: OperatorPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  if (props.variant === "dropdown") {
    const {
      operators,
      value,
      onSelect,
      variant: _variant,
      ...dropdownProps
    } = props;
    return (
      <div ref={forwardedRef} data-field="operator">
        <Dropdown<ColumnFilterOp>
          {...dropdownProps}
          value={value}
          selected={[value]}
          onSelectionChange={(evt, [operator]) => {
            if (operator !== undefined) {
              onSelect(evt, operator);
            }
          }}
        >
          {operators.map((op) => (
            <Option value={op} key={op}>
              {op}
            </Option>
          ))}
        </Dropdown>
      </div>
    );
  }
  return <OperatorCombobox {...props} ref={forwardedRef} />;
});

const OperatorCombobox = forwardRef(function OperatorCombobox(
  {
    className,
    column,
    dropdownOnAutofocus = true,
    inputProps,
    onSelect,
    operators,
    value: valueProp,
  }: OperatorComboboxProps,
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
      {(operators ?? getOperators(column))
        .filter((op) =>
          op.toLowerCase().includes(comboProps.value.toLowerCase()),
        )
        .map((op) => (
          <Option value={op} key={op} />
        ))}
    </ExpandoCombobox>
  );
});
