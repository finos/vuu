import { ComboBox, FormField } from "@heswell/salt-lab";
import { usa_states } from "./List.data";

let displaySequence = 1;

export const DefaultCombobox = () => {
  return (
    <FormField label="US States" labelPlacement="top" style={{ width: 120 }}>
      <ComboBox source={usa_states} width={120} />
    </FormField>
  );
};

DefaultCombobox.displaySequence = displaySequence++;
