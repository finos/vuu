import React from "react";

import { FormField } from "@heswell/uitk-core";
import { ComboBox } from "@heswell/uitk-lab";
import { usa_states } from "./List.data";

let displaySequence = 1;

export const DefaultCombobox = () => {
  // const handleChange: SelectionChangeHandler = (event, selectedItem) => {
  //   console.log("selection changed", selectedItem);
  // };
  return (
    <FormField label="US States" labelPlacement="top" style={{ width: 120 }}>
      <ComboBox source={usa_states} width={120} />
    </FormField>
  );
};

DefaultCombobox.displaySequence = displaySequence++;
