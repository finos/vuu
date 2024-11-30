import { FormField, FormFieldLabel, Input } from "@salt-ds/core";

export const WithFormField = () => {
  return (
    <FormField style={{ width: 292 }}>
      <FormFieldLabel>ADA compliant label</FormFieldLabel>
      <Input defaultValue="Value" />
    </FormField>
  );
};
