import { ComboBox, ComboBoxProps, Option } from "@salt-ds/core";
import { ChangeEvent, SyntheticEvent, useState } from "react";
import { usStateExampleData } from "./exampleData";

const usStates = usStateExampleData.slice(0, 10);

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

const BaseComboBox = (props: ComboBoxProps) => {
  const [value, setValue] = useState(getTemplateDefaultValue(props));

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    console.log(`handleChange ${event.target.value.toString()}`);
    const value = event.target.value;
    setValue(value);
  };

  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: string[],
  ) => {
    props.onSelectionChange?.(event, newSelected);
    console.log(`handleSelectionChange ${newSelected.toString()}`);

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
    <ComboBox
      {...props}
      data-showcase-center
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
      value={value}
      style={{ width: 150 }}
    >
      {usStates
        .filter((state) =>
          state.toLowerCase().includes(value.trim().toLowerCase()),
        )
        .map((state) => (
          <Option value={state} key={state} />
        ))}
    </ComboBox>
  );
};

export const DefaultComboBox = () => <BaseComboBox />;

export const Placeholder = () => <BaseComboBox placeholder="State" />;

export const WithDefaultSelected = () => (
  <BaseComboBox defaultSelected={["California"]} />
);

export const ReadOnly = () => (
  <BaseComboBox defaultSelected={["California"]} readOnly />
);

export const ReadOnlyEmpty = () => <BaseComboBox readOnly />;

export const Disabled = () => (
  <BaseComboBox disabled defaultSelected={["California"]} />
);

export const DisabledOption = () => {
  const [value, setValue] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(value);
  };

  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: string[],
  ) => {
    if (newSelected.length === 1) {
      setValue(newSelected[0]);
    } else {
      setValue("");
    }
  };

  return (
    <ComboBox
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
      value={value}
    >
      {usStates
        .filter((state) =>
          state.toLowerCase().includes(value.trim().toLowerCase()),
        )
        .map((state) => (
          <Option value={state} key={state} disabled={state === "California"} />
        ))}
    </ComboBox>
  );
};

export const MultiplePills = () => (
  <BaseComboBox
    defaultSelected={["Alabama", "Alaska", "Arizona"]}
    multiselect
  />
);

export const MultiplePillsTruncated = () => (
  <BaseComboBox
    defaultSelected={["Alabama", "Alaska", "Arizona"]}
    multiselect
    truncate
  />
);

export const MultiplePillsControlledSelection = (props: ComboBoxProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [value, setValue] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setValue(value);
  };

  const handleSelectionChange = (
    event: SyntheticEvent,
    newSelected: string[],
  ) => {
    setSelected(newSelected);
  };

  return (
    <ComboBox
      data-showcase-center
      multiselect
      onChange={handleChange}
      onSelectionChange={handleSelectionChange}
      selected={selected}
      style={{ width: 150 }}
      value={value}
    >
      {usStates
        .filter((state) =>
          state.toLowerCase().includes(value.trim().toLowerCase()),
        )
        .map((state) => (
          <Option value={state} key={state} />
        ))}
    </ComboBox>
  );
};
