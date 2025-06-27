import {
  ListBox,
  ListBoxProps,
  Option,
  OptionProps,
  StackLayout,
  Text,
} from "@salt-ds/core";
import { DragDropProvider } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import { useCallback, useRef, type ReactElement } from "react";
import { shortColorWithHex, usStateExampleData } from "./exampleData";

import "./List.examples.css";

const shortStatesData = usStateExampleData.slice(0, 12);

function SortableOption({
  id,
  index,
  value,
}: OptionProps & { id: string; index: number }) {
  const { ref } = useSortable({ id, index });
  return <Option id={id} ref={ref} value={value} />;
}

export const NoScrolling = (props: ListBoxProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const handleDragEnd = useCallback(() => {
    setTimeout(() => {
      const listItems = ref.current?.querySelectorAll(".saltOption");
      if (listItems) {
        const items = Array.from(listItems).map(({ id }) => id);
        console.log(items.join(","));
      }
    }, 300);
  }, []);
  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <ListBox
        {...props}
        bordered
        ref={ref}
        style={{ width: 200, maxHeight: 600 }}
      >
        {shortStatesData.map((state, index) => (
          <SortableOption id={state} index={index} key={state} value={state} />
        ))}
      </ListBox>
    </DragDropProvider>
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
