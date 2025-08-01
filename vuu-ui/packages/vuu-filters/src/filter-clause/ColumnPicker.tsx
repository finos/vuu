import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ExpandoCombobox, ExpandoComboboxProps } from "./ExpandoCombobox";
import { ComboBoxProps, Option } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { useExpandoComboBox } from "./useExpandoCombobox";

export type ColumnPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  columns: ColumnDescriptor[];
  onSelect: (evt: SyntheticEvent, columnName: string) => void;
  defaultDropdown?: ExpandoComboboxProps["defaultDropdown"];
};

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    className,
    columns,
    inputProps,
    onSelect,
    value: valueProp,
    defaultDropdown = true,
  }: ColumnPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>,
) {
  const comboProps = useExpandoComboBox({
    onSelect,
    value: valueProp?.toString() ?? "",
  });

  return (
    <ExpandoCombobox
      {...comboProps}
      inputProps={inputProps}
      className={className}
      data-field="column"
      ref={forwardedRef}
      title="column"
      defaultDropdown={defaultDropdown}
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
