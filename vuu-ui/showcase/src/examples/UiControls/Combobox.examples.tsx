import { FormField, FormFieldLabel } from "@salt-ds/core";
import { ComboBox } from "@finos/vuu-ui-controls";

import { usa_states } from "./List.data";
import { FormEvent, useCallback, useMemo } from "react";

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

export const DefaultComboboxDefaultHighlightedIndex = () => {
  return (
    <ComboBox
      initialHighlightedIndex={0}
      source={usa_states}
      style={{ background: "yellow" }}
      width={120}
    />
  );
};
DefaultComboboxDefaultHighlightedIndex.displaySequence = displaySequence++;

export const ComboboxEmptyDefaultValue = () => {
  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    console.log(`value = ${value}`);
  }, []);

  const InputProps = useMemo(
    () => ({
      inputProps: {
        autoComplete: "off",
        onInput: handleInputChange,
      },
    }),
    [handleInputChange]
  );

  return (
    <ComboBox
      InputProps={InputProps}
      source={usa_states}
      style={{ background: "yellow" }}
      defaultValue=""
      width={120}
    />
  );
};
ComboboxEmptyDefaultValue.displaySequence = displaySequence++;

export const ComboboxDefaultValue = () => {
  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    console.log(`value = ${value}`);
  }, []);

  const InputProps = useMemo(
    () => ({
      inputProps: {
        autoComplete: "off",
        onInput: handleInputChange,
      },
    }),
    [handleInputChange]
  );

  return (
    <ComboBox
      InputProps={InputProps}
      source={usa_states}
      style={{ background: "yellow" }}
      defaultValue="Alabama"
      width={120}
    />
  );
};

ComboboxDefaultValue.displaySequence = displaySequence++;

export const ComboboxFormField = () => {
  return (
    <FormField labelPlacement="top" style={{ width: 120 }}>
      <FormFieldLabel>US Sattes</FormFieldLabel>
      <ComboBox source={usa_states} width={120} />
    </FormField>
  );
};

ComboboxFormField.displaySequence = displaySequence++;

export const MultiSelectCombobox = () => {
  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    console.log(`value = ${value}`);
  }, []);

  const InputProps = useMemo(
    () => ({
      inputProps: {
        autoComplete: "off",
        onInput: handleInputChange,
      },
    }),
    [handleInputChange]
  );

  return (
    <ComboBox
      InputProps={InputProps}
      source={usa_states}
      selectionStrategy="multiple"
      style={{ background: "yellow" }}
      defaultValue=""
      width={120}
    />
  );
};
MultiSelectCombobox.displaySequence = displaySequence++;
