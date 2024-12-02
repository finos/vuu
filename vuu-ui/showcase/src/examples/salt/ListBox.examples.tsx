import { ListBox, ListBoxProps, Option } from "@salt-ds/core";
import { usa_states } from "./List.data";

const usa_10_states = usa_states.slice(0, 10);

const ListBoxTemplate = (props: Partial<ListBoxProps>) => {
  return (
    <ListBox {...props} style={{ width: 200 }}>
      {usa_10_states.map((state) => (
        <Option key={state} value={state} />
      ))}
    </ListBox>
  );
};

export const DefaultListBox = () => <ListBoxTemplate />;

export const BorderedListBox = () => <ListBoxTemplate bordered />;
