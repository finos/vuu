import { Dropdown, Option } from "@salt-ds/core";
import type { CommitHandler } from "@vuu-ui/vuu-utils";
import { type SyntheticEvent, useCallback } from "react";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface EditControlDropdownProps {
  className?: string;
  onCommit: CommitHandler<HTMLElement>;
  /** Either a list of values, or of options with distinct labels. */
  values: readonly string[] | readonly DropdownOption[];
  value?: unknown;
}

const toOption = (value: string | DropdownOption): DropdownOption =>
  typeof value === "string" ? { label: value, value } : value;

/** A dropdown that commits its value when an option is selected. */
export const EditControlDropdown = ({
  className,
  onCommit,
  value,
  values,
}: EditControlDropdownProps) => {
  const options = values.map(toOption);
  const selectedValue = value === undefined ? "" : String(value);
  const selected = options.find((option) => option.value === selectedValue);

  const handleSelectionChange = useCallback(
    (evt: SyntheticEvent, [option]: DropdownOption[]) => {
      if (option) {
        onCommit(evt as SyntheticEvent<HTMLElement>, option.value);
      }
    },
    [onCommit],
  );

  return (
    <Dropdown<DropdownOption>
      bordered
      className={className}
      data-edit-control
      data-icon="triangle-down"
      onSelectionChange={handleSelectionChange}
      placeholder="Please select value"
      selected={selected ? [selected] : []}
      value={selected?.label ?? selectedValue}
    >
      {options.map((option) => (
        <Option key={option.value} value={option}>
          {option.label}
        </Option>
      ))}
    </Dropdown>
  );
};
