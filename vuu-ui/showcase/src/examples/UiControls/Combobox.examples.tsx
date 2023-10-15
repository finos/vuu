import { FormField, FormFieldLabel, Input } from "@salt-ds/core";
import {
  ComboBox,
  MultiSelectionHandler,
  SingleSelectionHandler,
} from "@finos/vuu-ui-controls";

import { usa_states } from "./List.data";
import { FormEvent, useCallback, useMemo } from "react";

let displaySequence = 1;

export const DefaultCombobox = () => {
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`selectionChange ${selected}`);
    },
    []
  );
  return (
    <ComboBox
      source={usa_states}
      onSelectionChange={handleSelectionChange}
      style={{ background: "yellow" }}
      width={120}
    />
  );
};

DefaultCombobox.displaySequence = displaySequence++;

export const OpenOnFocus = () => {
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`selectionChange ${selected}`);
    },
    []
  );
  return (
    <div
      style={{
        alignItems: "flex-start",
        height: 500,
        display: "flex",
        gap: 20,
      }}
    >
      <Input style={{ width: 100 }} />
      <ComboBox
        source={usa_states}
        onSelectionChange={handleSelectionChange}
        style={{ background: "yellow" }}
        width={200}
      />
      <ComboBox
        source={usa_states}
        onSelectionChange={handleSelectionChange}
        style={{ background: "green" }}
        width={200}
      />
    </div>
  );
};

OpenOnFocus.displaySequence = displaySequence++;

export const ComboboxDefaultSelection = () => {
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`selectionChange ${selected}`);
    },
    []
  );
  return (
    <ComboBox
      defaultSelected={"Texas"}
      source={usa_states}
      onSelectionChange={handleSelectionChange}
      style={{ background: "yellow" }}
      width={120}
    />
  );
};

ComboboxDefaultSelection.displaySequence = displaySequence++;

export const ComboboxAllowFreeText = () => {
  const handleSelectionChange = useCallback((evt, selected) => {
    console.log(`selectionChange ${selected}`);
  }, []);
  return (
    <ComboBox
      allowFreeText
      source={usa_states}
      onSelectionChange={handleSelectionChange}
      width={120}
    />
  );
};

ComboboxAllowFreeText.displaySequence = displaySequence++;

export const ComboboxDefaultHighlightedIndex = () => {
  return (
    <ComboBox
      initialHighlightedIndex={0}
      source={usa_states}
      style={{ background: "yellow" }}
      width={120}
    />
  );
};
ComboboxDefaultHighlightedIndex.displaySequence = displaySequence++;

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
      <FormFieldLabel>US States</FormFieldLabel>
      <ComboBox source={usa_states} width={120} />
    </FormField>
  );
};

ComboboxFormField.displaySequence = displaySequence++;

export const ComboboxFormFieldNoAdornment = () => {
  return (
    <FormField labelPlacement="top" style={{ width: 120 }}>
      <FormFieldLabel>US States</FormFieldLabel>
      <ComboBox
        InputProps={{
          endAdornment: null,
        }}
        source={usa_states}
        width={120}
      />
    </FormField>
  );
};

ComboboxFormFieldNoAdornment.displaySequence = displaySequence++;

export const MultiSelectCombobox = () => {
  const itemsToString = (items: string[]) => {
    return `${items.length} items`;
  };

  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    console.log(`value = ${value}`);
  }, []);

  const handleSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, selected) => {
      console.log(`selectionChange ${selected.join(",")}`);
    },
    []
  );

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
      itemsToString={itemsToString}
      onSelectionChange={handleSelectionChange}
      source={usa_states}
      selectionStrategy="multiple"
      style={{ background: "yellow" }}
    />
  );
};
MultiSelectCombobox.displaySequence = displaySequence++;

export const MultiSelectComboboxDefaultSelected = () => {
  const handleInputChange = useCallback((evt: FormEvent<HTMLInputElement>) => {
    const { value } = evt.target as HTMLInputElement;
    console.log(`value = ${value}`);
  }, []);

  const handleSelectionChange = useCallback((evt, selected) => {
    console.log(`selectionChange ${selected.join(",")}`);
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
      defaultSelected={["Alabama", "Texas"]}
      onSelectionChange={handleSelectionChange}
      source={usa_states}
      selectionStrategy="multiple"
      style={{ background: "yellow" }}
    />
  );
};
MultiSelectComboboxDefaultSelected.displaySequence = displaySequence++;

export const ComboboxBlurBehaviour = () => {
  const handleSelectionChange = useCallback<SingleSelectionHandler>(
    (evt, selected) => {
      console.log(`selectionChange ${selected}`);
    },
    []
  );
  return (
    <div
      style={{
        alignItems: "center",
        background: "lightgray",
        display: "flex",
        gap: 24,
        height: 60,
        padding: "0px 12px",
      }}
    >
      {" "}
      <Input style={{ width: 100 }} />
      <ComboBox
        source={usa_states}
        onSelectionChange={handleSelectionChange}
        style={{ background: "yellow" }}
        width={120}
      />
      <Input style={{ width: 100 }} />
    </div>
  );
};

ComboboxBlurBehaviour.displaySequence = displaySequence++;
