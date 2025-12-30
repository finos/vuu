import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ExpandoCombobox } from "../ExpandoCombobox";
import { ComboBoxProps, Option, useForkRef } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { useColumnPicker } from "./useColumnPicker";

export type ColumnPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  columns: ColumnDescriptor[];
  onSelect: (evt: SyntheticEvent, columnName: string) => void;
  dropdownOnAutofocus?: boolean;
};

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    className,
    columns,
    dropdownOnAutofocus = true,
    inputProps,
    onSelect,
    value: valueProp,
  }: ColumnPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const { ref, ...comboProps } = useColumnPicker({
    onSelect,
    value: valueProp?.toString() ?? "",
  });

  return (
    <ExpandoCombobox
      {...comboProps}
      className={className}
      data-field="column"
      dropdownOnAutofocus={dropdownOnAutofocus}
      inputProps={inputProps}
      ref={useForkRef(forwardedRef, ref)}
      title="column"
    >
      {columns
        .filter(({ name }) =>
          name.toLowerCase().includes(comboProps.value.toLowerCase()),
        )
        .map(({ name, label = name }) => (
          <Option value={name} key={name}>
            {label}
          </Option>
        ))}
    </ExpandoCombobox>
  );
});
