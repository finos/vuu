import { FormField, FormFieldLabel } from "@salt-ds/core";
import { ComboBox } from "@finos/vuu-ui-controls";

import { usa_states } from "./List.data";

let displaySequence = 1;

export const DefaultCombobox = () => {
  return (
    <ComboBox
      source={usa_states}
      style={{ background: "yellow" }}
      width={120}
    />
  );
};

DefaultCombobox.displaySequence = displaySequence++;

export const ComboboxFormField = () => {
  return (
    <FormField labelPlacement="top" style={{ width: 120 }}>
      <FormFieldLabel>US Sattes</FormFieldLabel>
      <ComboBox source={usa_states} width={120} />
    </FormField>
  );
};

ComboboxFormField.displaySequence = displaySequence++;
