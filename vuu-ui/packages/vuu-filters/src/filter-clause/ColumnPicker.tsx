import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { ComboBoxProps, Option } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";
import { useExpandoComboBox } from "./useExpandoCombobox";

export type ColumnPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  columns: ColumnDescriptor[];
  onSelect: (evt: SyntheticEvent, columnName: string) => void;
};

export const ColumnPicker = forwardRef(function ColumnPicker(
  {
    className,
    columns,
    inputProps,
    onSelect,
    value: valueProp,
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
    >
      {columns
        .filter(({ name }) =>
          name.toLowerCase().includes(comboProps.value.toLowerCase()),
        )
        .map(({ name, label = name }) => (
          <Option value={label} key={name} />
        ))}
    </ExpandoCombobox>
  );
});
