import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { ExpandoCombobox } from "../../../expando-combobox/ExpandoCombobox";
import { getOptionList } from "../../../expando-combobox/option-list-utils";
import { ComboBoxProps, Option, useForkRef } from "@salt-ds/core";
import { ForwardedRef, SyntheticEvent, forwardRef, useCallback } from "react";
import {
  getColumnText,
  getColumnTextByName,
  useColumnPicker,
} from "./useColumnPicker";

export type ColumnPickerProps = Pick<
  ComboBoxProps,
  "className" | "inputProps" | "value"
> & {
  columns: readonly ColumnDescriptor[];
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
  const { ref, typedText, ...comboProps } = useColumnPicker({
    onSelect,
    value: valueProp?.toString() ?? "",
  });

  // the user sees column labels, the selected value is the column name
  const columnNameToText = useCallback(
    (columnName: string) => getColumnTextByName(columns, columnName),
    [columns],
  );

  return (
    <ExpandoCombobox
      {...comboProps}
      className={className}
      data-field="column"
      dropdownOnAutofocus={dropdownOnAutofocus}
      inputProps={inputProps}
      itemToString={columnNameToText}
      ref={useForkRef(forwardedRef, ref)}
    >
      {getOptionList(
        columns,
        getColumnText,
        typedText,
        columnNameToText(comboProps.value),
      ).map((column) => (
        <Option value={column.name} key={column.name}>
          {getColumnText(column)}
        </Option>
      ))}
    </ExpandoCombobox>
  );
});
