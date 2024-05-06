import { ComboBoxProps, Option } from "@salt-ds/core";
import { ExpandoCombobox, ExpandoComboboxSalt } from "@finos/vuu-filters";
import { ChangeEvent, SyntheticEvent, useState } from "react";

let displaySequence = 1;

const longUsStates = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

export const DefaultExpandoCombobox = () => (
  <ExpandoCombobox
    data-showcase-center
    source={longUsStates}
    style={{ border: "solid 1px black", minWidth: 16 }}
  />
);
DefaultExpandoCombobox.displaySequence = displaySequence++;

function getTemplateDefaultValue({
  defaultValue,
  defaultSelected,
  multiselect,
}: Pick<
  ComboBoxProps,
  "defaultValue" | "defaultSelected" | "multiselect"
>): string {
  if (multiselect) {
    return "";
  }

  if (defaultValue) {
    return String(defaultValue);
  }

  return defaultSelected?.[0] ?? "";
}

export const DefaultExpandoComboboxSalt = (props: ComboBoxProps) => {
  const [value, setValue] = useState(getTemplateDefaultValue(props));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    console.log(`value = ${value}`);
    setValue(value);
  };

  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: string[]
  ) => {
    props.onSelectionChange?.(event, newSelected);
    if (props.multiselect) {
      setValue("");
      return;
    }
    if (newSelected.length === 1) {
      setValue(newSelected[0]);
    } else {
      setValue("");
    }
  };

  return (
    <ExpandoComboboxSalt
      data-showcase-center
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
      style={{ border: "solid 1px black", minWidth: 16 }}
      value={value}
    >
      {longUsStates
        .filter((state) =>
          state.toLowerCase().includes(value.trim().toLowerCase())
        )
        .map((state) => (
          <Option value={state} key={state} />
        ))}
    </ExpandoComboboxSalt>
  );
};
DefaultExpandoComboboxSalt.displaySequence = displaySequence++;
