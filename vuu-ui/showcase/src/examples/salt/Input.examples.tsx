import React from "react";
import { FormField, Input } from "@heswell/salt-lab";

export const WithFormField = () => {
  return (
    <FormField label="ADA compliant label" style={{ width: 292 }}>
      <Input defaultValue="Value" />
    </FormField>
  );
};
