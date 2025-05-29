import {
  Dropdown,
  DropdownProps,
  Option,
  OptionGroup,
  FormField,
  FormFieldHelperText,
  FormFieldLabel,
  StackLayout,
} from "@salt-ds/core";
import { Icon } from "@vuu-ui/vuu-ui-controls";

import { SyntheticEvent, useState } from "react";
// import { LocationIcon } from "@salt-ds/icons";

const usStates = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
];

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

const BaseDropdown = (args: DropdownProps) => (
  <Dropdown {...args}>
    {usStates.map((state) => (
      <Option value={state} key={state} />
    ))}
  </Dropdown>
);

export const DefaultDropdown = () => <BaseDropdown />;

export const Placeholder = () => <BaseDropdown placeholder="State" />;

export const WithDefaultSelected = () => (
  <BaseDropdown defaultSelected={["California"]} />
);

export const Readonly = () => (
  <BaseDropdown readOnly defaultSelected={["California"]} />
);

export const Disabled = () => (
  <BaseDropdown disabled defaultSelected={["California"]} />
);

export const DisabledOption = () => (
  <Dropdown>
    {usStates.map((state) => (
      <Option value={state} key={state} disabled={state === "California"} />
    ))}
  </Dropdown>
);

export const Variants = () => (
  <StackLayout>
    <Dropdown>
      {usStates.map((state) => (
        <Option value={state} key={state} />
      ))}
    </Dropdown>
    <Dropdown variant="secondary">
      {usStates.map((state) => (
        <Option value={state} key={state} />
      ))}
    </Dropdown>
  </StackLayout>
);

export const MultiSelect = () => <BaseDropdown multiselect />;

export const WithFormField = () => {
  return (
    <FormField>
      <FormFieldLabel>State</FormFieldLabel>
      <Dropdown>
        {usStates.map((state) => (
          <Option value={state} key={state} />
        ))}
      </Dropdown>
      <FormFieldHelperText>Pick a US state</FormFieldHelperText>
    </FormField>
  );
};

export const Grouped = () => (
  <Dropdown>
    <OptionGroup label="US">
      <Option value="Chicago" />
      <Option value="Miami" />
      <Option value="New York" />
    </OptionGroup>
    <OptionGroup label="UK">
      <Option value="Liverpool" />
      <Option value="London" />
      <Option value="Manchester" />
    </OptionGroup>
  </Dropdown>
);

export const LongList = () => (
  <Dropdown>
    {longUsStates.map((state) => (
      <Option value={state} key={state} />
    ))}
  </Dropdown>
);

export const CustomValue = (props: Partial<DropdownProps>) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleSelectionChange: DropdownProps["onSelectionChange"] = (
    event,
    newSelected,
  ) => {
    setSelected(newSelected);
    props.onSelectionChange?.(event, newSelected);
  };

  return (
    <Dropdown
      {...props}
      selected={selected}
      value={
        selected.length < 2 ? selected[0] : `${selected.length} items selected`
      }
      onSelectionChange={handleSelectionChange}
      multiselect
    >
      {usStates.map((state) => (
        <Option value={state} key={state} />
      ))}
    </Dropdown>
  );
};

export const Validation = () => {
  return (
    <StackLayout>
      <BaseDropdown validationStatus="error" />
      <BaseDropdown validationStatus="warning" />
      <BaseDropdown validationStatus="success" />
    </StackLayout>
  );
};

export const WithStartAdornment = () => (
  <BaseDropdown startAdornment={<Icon name="user" />} />
);

interface Person {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
}

const people: Person[] = [
  { id: 1, firstName: "John", lastName: "Doe", displayName: "John Doe" },
  { id: 2, firstName: "Jane", lastName: "Doe", displayName: "Jane Doe" },
  { id: 3, firstName: "John", lastName: "Smith", displayName: "John Smith" },
  { id: 4, firstName: "Jane", lastName: "Smith", displayName: "Jane Smith" },
];

export const ObjectValue = () => {
  const [selected, setSelected] = useState<Person[]>([]);
  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: Person[],
  ) => {
    setSelected(newSelected);
  };

  return (
    <Dropdown<Person>
      onSelectionChange={handleSelectionChange}
      selected={selected}
      multiselect
      valueToString={(person) => person.displayName}
    >
      {people.map((person) => (
        <Option value={person} key={person.id} />
      ))}
    </Dropdown>
  );
};
