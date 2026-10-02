import { Dropdown, Option } from "@salt-ds/core";
import { FilterIcon } from "@salt-ds/icons";
import type { SyntheticEvent } from "react";
import { UNASSIGNED } from "../data/applications";
import { useApplications } from "../data/useApplicationModel";

export const ALL_APPLICATIONS = "";

interface ApplicationFilterOption {
  label: string;
  value: string;
}

export interface ApplicationFilterProps {
  /** Application name, UNASSIGNED, or ALL_APPLICATIONS. */
  value: string;
  /** Label of the UNASSIGNED option. */
  noAccessLabel?: string;
  onChange: (value: string) => void;
}

export const ApplicationFilter = ({
  noAccessLabel = "Unassigned",
  onChange,
  value,
}: ApplicationFilterProps) => {
  const { applications } = useApplications();
  const options: ApplicationFilterOption[] = [
    { label: "All applications", value: ALL_APPLICATIONS },
    ...applications.map(({ name, title }) => ({ label: title, value: name })),
    { label: noAccessLabel, value: UNASSIGNED },
  ];
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  return (
    <Dropdown<ApplicationFilterOption>
      aria-label="Application filter"
      bordered
      className="vuuIdentityAdmin-applicationFilter"
      startAdornment={<FilterIcon aria-hidden />}
      onSelectionChange={(
        _event: SyntheticEvent,
        [option]: ApplicationFilterOption[],
      ) => {
        if (option) onChange(option.value);
      }}
      selected={[selected]}
      value={selected.label}
    >
      {options.map((option) => (
        <Option key={option.value || "all"} value={option}>
          {option.label}
        </Option>
      ))}
    </Dropdown>
  );
};
