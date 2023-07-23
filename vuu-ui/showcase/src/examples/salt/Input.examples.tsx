import { FormField, Input } from "@salt-ds/core";

export const WithFormField = () => {
  return (
    <FormField label="ADA compliant label" style={{ width: 292 }}>
      <Input defaultValue="Value" />
    </FormField>
  );
};
