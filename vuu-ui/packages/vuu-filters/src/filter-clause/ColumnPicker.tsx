import type { ColumnDescriptor } from "@finos/vuu-table-types";
import {
  ExpandoComboboxSalt,
  ExpandoComboboxSaltProps,
} from "./ExpandoComboboxSalt";
import { ForwardedRef, SyntheticEvent, forwardRef } from "react";

export type ColumnPickerProps = Pick<
  ExpandoComboboxSaltProps,
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
    <ExpandoComboboxSalt
      inputProps={inputProps}
      className={className}
      data-field="column"
      onSelectionChange={handleSelectionChange}
      ref={forwardedRef}
      title="column"
      value={value}
      values={columns.map((c) => c.name)}
    />
  );
});
