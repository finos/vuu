import { FormField, FormFieldLabel, Input } from "@salt-ds/core";

export const WithFormField = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FormField style={{ width: 292 }}>
        <FormFieldLabel>ADA compliant label</FormFieldLabel>
        <Input defaultValue="Value" bordered />
      </FormField>

      <FormField style={{ width: 292 }}>
        <FormFieldLabel>Disabled</FormFieldLabel>
        <Input defaultValue="Value" bordered disabled />
      </FormField>

      <FormField style={{ width: 292 }}>
        <FormFieldLabel>Read Only</FormFieldLabel>
        <Input defaultValue="Value" bordered readOnly />
      </FormField>

      <FormField style={{ width: 292 }}>
        <FormFieldLabel>Error State</FormFieldLabel>
        <Input defaultValue="Value" bordered validationStatus="error" />
      </FormField>
    </div>
  );
};
