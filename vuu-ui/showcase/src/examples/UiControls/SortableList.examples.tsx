import { ListBox, ListBoxProps, StackLayout, Text } from "@salt-ds/core";
import { useCallback, type ReactElement } from "react";
import { shortColorWithHex, usStateExampleData } from "../salt/exampleData";
import { SortableList, SortableOption } from "@vuu-ui/vuu-ui-controls";

import "./List.examples.css";

const shortStatesData = usStateExampleData.slice(0, 12);

export const NoScrolling = (props: ListBoxProps) => {
  const handleReorderListItems = useCallback((listItems: unknown[]) => {
    console.log(listItems.join(","));
  }, []);
  return (
    <SortableList
      {...props}
      bordered
      style={{ width: 200, maxHeight: 600 }}
      onReorderListItems={handleReorderListItems}
    >
      {shortStatesData.map((state, index) => (
        <SortableOption id={state} index={index} key={state} value={state} />
      ))}
    </SortableList>
  );
};

export const WithScrolling = (props: ListBoxProps) => (
  <ListBox {...props} bordered style={{ width: 200, maxHeight: 600 }}>
    {usStateExampleData.map((state, index) => (
      <SortableOption id={state} index={index} key={state} value={state} />
    ))}
  </ListBox>
);

export const ComplexOptions = (): ReactElement => {
  return (
    <SortableList>
      {shortColorWithHex.slice(0, 5).map(({ color, hex }, index) => (
        <SortableOption id={color} index={index} value={color} key={color}>
          <StackLayout gap={0.5} align="start">
            <Text>{color}</Text>
            <Text styleAs="label" color="secondary">
              {hex}
            </Text>
          </StackLayout>
        </SortableOption>
      ))}
    </SortableList>
  );
};
