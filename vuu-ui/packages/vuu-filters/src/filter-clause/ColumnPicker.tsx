import type { ColumnDescriptor } from "@finos/vuu-table-types";
import { ExpandoCombobox } from "./ExpandoCombobox";
import { ComboBoxProps, Option } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";

export type ColumnPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  columns: ColumnDescriptor[];
  onSelect: (evt: SyntheticEvent, columnName: string) => void;
};

export const ColumnPicker = forwardRef(function ColumnPicker(
  { className, columns, inputProps, onSelect, value }: ColumnPickerProps,
  forwardedRef: ForwardedRef<HTMLDivElement>
) {
  const handleSelectionChange = (
    evt: SyntheticEvent,
    newSelected: string[]
  ) => {
    onSelect(evt, newSelected[0]);
  };

  return (
    <ExpandoCombobox
      inputProps={inputProps}
      className={className}
      data-field="column"
      onSelectionChange={handleSelectionChange}
      ref={forwardedRef}
      title="column"
      value={value}
    >
      {columns.map(({ name }) => (
        <Option value={name} key={name} />
      ))}
    </ExpandoCombobox>
  );
});
