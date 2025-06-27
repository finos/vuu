import {
  ListBox,
  ListBoxProps,
  Option,
  OptionGroup,
  StackLayout,
  Text,
} from "@salt-ds/core";
import type { ReactElement } from "react";
import { shortColorWithHex, usStateExampleData } from "./exampleData";

import "./List.examples.css";

const shortStatesData = usStateExampleData.slice(0, 4);

function groupByFirstLetter(data: typeof usStateExampleData) {
  return data.reduce(
    (acc, option) => {
      const groupName = option[0];
      if (!acc[groupName]) {
        acc[groupName] = [];
      }
      acc[groupName].push(option);
      return acc;
    },
    {} as Record<string, typeof usStateExampleData>,
  );
}

const ListTemplate = (props: ListBoxProps) => (
  <ListBox {...props}>
    {shortStatesData.map((state) => (
      <Option key={state} value={state} />
    ))}
  </ListBox>
);

export const SingleSelect = () => <ListTemplate />;

export const Multiselect = () => <ListTemplate multiselect />;

export const Grouped = (props: ListBoxProps) => (
  <ListBox {...props}>
    {Object.entries(groupByFirstLetter(shortStatesData)).map(
      ([firstLetter, options]) => (
        <OptionGroup label={firstLetter} key={firstLetter}>
          {options.map((state) => (
            <Option value={state} key={state} />
          ))}
        </OptionGroup>
      ),
    )}
  </ListBox>
);

export const DisabledOption = (props: ListBoxProps) => (
  <ListBox {...props}>
    {shortStatesData.map((state) => (
      <Option disabled={state === "Arizona"} key={state} value={state} />
    ))}
  </ListBox>
);

export const Bordered = <ListTemplate bordered />;

export const Scrolling = (props: ListBoxProps) => (
  <div style={{ maxHeight: 400 }}>
    <ListBox {...props}>
      {Object.entries(groupByFirstLetter(usStateExampleData)).map(
        ([firstLetter, options]) => (
          <OptionGroup label={firstLetter} key={firstLetter}>
            {options.map((state) => (
              <Option value={state} key={state} />
            ))}
          </OptionGroup>
        ),
      )}
    </ListBox>
  </div>
);

export const DefaultSelectedSingleSelect = () => (
  <ListTemplate defaultSelected={[usStateExampleData[3]]} />
);

export const DefaultSelectedMultiselect = () => (
  <ListTemplate
    multiselect
    defaultSelected={[usStateExampleData[3], usStateExampleData[4]]}
  />
);

export const Disabled = () => <ListTemplate disabled />;

export const ComplexOptions = (): ReactElement => {
  return (
    <ListBox>
      {shortColorWithHex.slice(0, 5).map(({ color, hex }) => (
        <Option value={color} key={color}>
          <StackLayout gap={0.5} align="start">
            <Text>{color}</Text>
            <Text styleAs="label" color="secondary">
              {hex}
            </Text>
          </StackLayout>
        </Option>
      ))}
    </ListBox>
  );
};
